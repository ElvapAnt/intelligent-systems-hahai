from __future__ import annotations

import cv2 as cv
import numpy as np
import tensorflow as tf


def generate_gradcam(
    model: tf.keras.Model, # type:ignore
    *,
    batch_x: np.ndarray,          # (1,H,W,3) float32 RGB
    img_bgr_512: np.ndarray,      # (H,W,3) uint8 BGR for overlay
    target_layer_name: str,
    alpha: float = 0.4,
) -> bytes:
    """
    Computes Grad-CAM for the model's single sigmoid output (unit 0),
    creates a COLORMAP_JET overlay on the provided image, returns PNG bytes.
    """
    target_layer = model.get_layer(target_layer_name)

    # Model that gives both conv maps and predictions
    grad_model = tf.keras.Model( # type:ignore
        inputs=model.inputs,
        outputs=[target_layer.output, model.output],
    )

    x = tf.convert_to_tensor(batch_x)

    with tf.GradientTape() as tape:
        conv_out, preds = grad_model(x, training=False)

        # For binary sigmoid, take the single output neuron as the "positive score"
        if len(preds.shape) == 2:
            score = preds[:, 0]
        else:
            score = preds

    grads = tape.gradient(score, conv_out)  # (1,h,w,c)
    if grads is None:
        raise ValueError("Gradients are None. Check target layer and model graph.")

    pooled_grads = tf.reduce_mean(grads, axis=(1, 2))  # (1,c)

    conv_out = conv_out[0]          # (h,w,c)
    pooled = pooled_grads[0]        # (c,)

    # Weight conv maps by pooled grads
    heatmap = tf.reduce_sum(conv_out * pooled[tf.newaxis, tf.newaxis, :], axis=-1)  # (h,w)

    # ReLU + normalize
    heatmap = tf.nn.relu(heatmap)
    maxv = tf.reduce_max(heatmap)
    heatmap = tf.where(maxv > 0, heatmap / maxv, heatmap)

    heatmap_np = heatmap.numpy()
    heatmap_np = cv.resize(heatmap_np, (img_bgr_512.shape[1], img_bgr_512.shape[0]))
    heatmap_np = cv.resize(heatmap_np, (img_bgr_512.shape[1], img_bgr_512.shape[0]))

    # ensure [0,1]
    heatmap_np = np.clip(heatmap_np, 0.0, 1.0)

    # uint8 single-channel
    heatmap_u8 = (heatmap_np * 255).astype(np.uint8)

    # make contiguous (helps both runtime and type stubs)
    heatmap_u8 = np.ascontiguousarray(heatmap_u8)

    heatmap_color = cv.applyColorMap(heatmap_u8, int(cv.COLORMAP_JET))

    superimposed = (heatmap_color.astype(np.float32) * float(alpha) +
                    img_bgr_512.astype(np.float32)).clip(0, 255).astype(np.uint8)

    ok, buf = cv.imencode(".png", superimposed)
    if not ok:
        raise ValueError("Failed to encode gradcam overlay as PNG")
    return buf.tobytes()