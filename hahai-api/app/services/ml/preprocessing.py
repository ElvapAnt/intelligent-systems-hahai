from __future__ import annotations

import cv2 as cv
import numpy as np


def square_resize_image(
    img_bgr: np.ndarray,
    out_size: int = 512,
    pad_mode: str = "constant",
    pad_value: int = 0,
    use_border_median: bool = False,
) -> np.ndarray:
    if img_bgr is None:
        raise ValueError("square_resize_image received None image")

    h, w = img_bgr.shape[:2]
    side = max(h, w)

    top = (side - h) // 2
    bottom = side - h - top
    left = (side - w) // 2
    right = side - w - left

    if use_border_median:
        border_pixels = np.vstack([
            img_bgr[0, :, :], img_bgr[-1, :, :], img_bgr[:, 0, :], img_bgr[:, -1, :]
        ])
        pad_color = np.median(border_pixels.reshape(-1, 3), axis=0).astype(np.uint8).tolist()
        padded = cv.copyMakeBorder(img_bgr, top, bottom, left, right,
                                   borderType=cv.BORDER_CONSTANT, value=pad_color)
    else:
        if pad_mode == "replicate":
            padded = cv.copyMakeBorder(img_bgr, top, bottom, left, right,
                                       borderType=cv.BORDER_REPLICATE)
        else:
            padded = cv.copyMakeBorder(img_bgr, top, bottom, left, right,
                                       borderType=cv.BORDER_CONSTANT, value=(pad_value, pad_value, pad_value))

    if padded.shape[0] != out_size or padded.shape[1] != out_size:
        padded = cv.resize(padded, (out_size, out_size), interpolation=cv.INTER_AREA)

    return padded


def decode_image_bytes_to_bgr(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv.imdecode(arr, cv.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("Failed to decode image bytes")

    # Force 3-channel BGR (model expects 3 channels)
    if img.ndim == 2:
        img = cv.cvtColor(img, cv.COLOR_GRAY2BGR)
    elif img.shape[2] == 4:
        img = cv.cvtColor(img, cv.COLOR_BGRA2BGR)

    return img


def format_img_for_model_input(
    image_bytes: bytes,
    *,
    image_size: int = 512,
    output_format: str = "jpg",   # "jpg" or "png"
    jpg_quality: int = 95,
    already_preproc: bool = False,
) -> tuple[np.ndarray, np.ndarray, bytes, str]:
    """
    Returns:
      - img_bgr_512: uint8 BGR image (512x512)
      - batch_x: float32 RGB batch (1,512,512,3)
      - stored_bytes: encoded bytes (jpg/png) for Redis storage/display
      - stored_content_type: "image/jpeg" or "image/png"
    """
    img_bgr = decode_image_bytes_to_bgr(image_bytes)

    if already_preproc:
        img_bgr_512 = cv.resize(img_bgr, (image_size, image_size), interpolation=cv.INTER_AREA) \
            if img_bgr.shape[:2] != (image_size, image_size) else img_bgr
    else:
        from app.services.ml.preprocessing import square_resize_image  # keep your existing function
        img_bgr_512 = square_resize_image(img_bgr, out_size=image_size)

    img_rgb_512 = cv.cvtColor(img_bgr_512, cv.COLOR_BGR2RGB).astype(np.float32)
    batch_x = np.expand_dims(img_rgb_512, axis=0)

    if output_format.lower() in ("jpg", "jpeg"):
        ok, buf = cv.imencode(".jpg", img_bgr_512, [int(cv.IMWRITE_JPEG_QUALITY), int(jpg_quality)])
        if not ok:
            raise ValueError("Failed to encode standardized xray as JPG")
        return img_bgr_512, batch_x, buf.tobytes(), "image/jpeg"

    ok, buf = cv.imencode(".png", img_bgr_512)
    if not ok:
        raise ValueError("Failed to encode standardized xray as PNG")
    return img_bgr_512, batch_x, buf.tobytes(), "image/png"
