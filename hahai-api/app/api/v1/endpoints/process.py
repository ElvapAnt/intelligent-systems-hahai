from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from redis.asyncio.client import Redis
import tensorflow as tf

from app.api.dependencies import get_model, get_redis, get_redis_bin, require_intern
from app.config import settings
from app.services.ml.preprocessing import format_img_for_model_input
from app.services.ml.model import predict_binary
from app.services.ml.gradcam import generate_gradcam
from app.services.storage.records import create_temp_record, cancel_temp_record, TempRecordOwnershipError

router = APIRouter()

@router.post("")
async def start_processing(
    xray: UploadFile = File(...),
    student_id: str = Depends(require_intern),
    model: tf.keras.Model = Depends(get_model), #type:ignore
    redis: Redis = Depends(get_redis),
    redis_bin: Redis = Depends(get_redis_bin),
):
    raw_bytes = await xray.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Empty xray upload")

    # 1) preprocess (standardize to 512 and build model input)
    img_bgr_512, batch_x, xray_bytes_out, xray_ct = format_img_for_model_input(
        raw_bytes,
        image_size=settings.IMAGE_SIZE,
        output_format="jpg",
        jpg_quality=95,
    )

    # 2) predict
    pred_label, pred_accuracy, _p = predict_binary(model, batch_x)

    # 3) gradcam overlay
    gradcam_bytes = generate_gradcam(
        model,
        batch_x=batch_x,
        img_bgr_512=img_bgr_512,
        target_layer_name=settings.ENCODER_LAST_CONV_LAYER,
        alpha=settings.GRADCAM_ALPHA,
    )
    gradcam_ct = "image/png"  # change to image/jpeg if you encode gradcam as jpg

    # 4) store temp keys under record:{temp_id}*
    temp_id = await create_temp_record(
        redis, redis_bin,
        student_id=student_id,
        pred_label=pred_label,
        pred_accuracy=pred_accuracy,
        xray_bytes=xray_bytes_out,
        xray_content_type=xray_ct,
        gradcam_bytes=gradcam_bytes,
        gradcam_content_type=gradcam_ct,
        ttl_seconds= 10 * 60,
    )

    return {
        "temp_id": temp_id,
        "pred_label": pred_label,
        "pred_accuracy": pred_accuracy,
        # reuse existing /records image routes
        "xray_url": f"/api/v1/records/{temp_id}/xray",
        "gradcam_url": f"/api/v1/records/{temp_id}/gradcam",
        "expires_in_seconds": 10 * 60,
    }


@router.delete("/{temp_id}")
async def cancel_processing(
    temp_id: str,
    student_id: str = Depends(require_intern),
    redis: Redis = Depends(get_redis),
    redis_bin: Redis = Depends(get_redis_bin),
):
    try:
        await cancel_temp_record(redis, redis_bin, temp_id=temp_id, student_id=student_id)
        return {"status": "cancelled", "temp_id": temp_id}
    except TempRecordOwnershipError as e:
        raise HTTPException(status_code=403, detail=str(e))
