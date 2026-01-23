import tensorflow as tf
import numpy as np

@tf.keras.utils.register_keras_serializable(package="preproc") # type:ignore
def effb4_preprocess(x):
    return tf.keras.applications.efficientnet.preprocess_input(x) #type:ignore 


def load_keras_model(model_path: str) -> tf.keras.Model: # type:ignore
    # compile=False is fine for inference and avoids needing optimizer/loss
    model = tf.keras.models.load_model(model_path, compile=False) # type:ignore
    return model


def predict_binary(model: tf.keras.Model, batch_x: np.ndarray) -> tuple[str, float, float]: # type:ignore
    """
    Returns: (pred_label, pred_accuracy_0_100, p_positive)
    Assumes sigmoid output in [0,1], shape (N,1) or (N,)
    """
    y = model.predict(batch_x, verbose=1)

    # normalize output to scalar p
    p = float(y[0][0] if hasattr(y[0], "__len__") else y[0])

    pred_class = 1 if p >= 0.5 else 0
    pred_label = "positive" if pred_class == 1 else "negative"

    certainty = p if pred_class == 1 else (1.0 - p)
    pred_accuracy = float(certainty * 100.0)

    return pred_label, pred_accuracy, p