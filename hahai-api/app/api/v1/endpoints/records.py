from __future__ import annotations

import base64

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from redis.asyncio.client import Redis

from app.api.dependencies import get_redis, get_redis_bin, require_admin, require_intern
from app.schemas.patient_record import PatientRecordOut, PatientRecordSaveIn
from app.services.storage import records as record_store
from app.services.storage import images as image_store
from app.services.storage.records import promote_temp_record, TempRecordNotFoundError, TempRecordOwnershipError, TempRecordInvalidError

router = APIRouter()

def _record_to_out(record: dict) -> PatientRecordOut:
    case_id = record["case_id"]
    return PatientRecordOut(
        case_id=case_id,
        student_id=record["student_id"],
        notes=record.get("notes", ""),
        pred_label=record.get("pred_label", ""),
        pred_accuracy=float(record.get("pred_accuracy", 0.0)),
        xray_url=f"/api/v1/records/{case_id}/xray",
        gradcam_url=f"/api/v1/records/{case_id}/gradcam",
    )


@router.post(
    "/test",
    response_model=PatientRecordOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_record_test(
    student_id: str = Depends(require_intern),
    notes: str = Form(""),
    xray: UploadFile = File(...),

    # For now these are optional so you can test full CRUD without ML wired.
    # When ML is integrated, these will be produced server-side.
    pred_label: str = Form("negative"),
    pred_accuracy: float = Form(50.0),

    # Gradcam optional for now; if not provided, we store empty bytes
    gradcam: UploadFile | None = File(None),

    redis: Redis = Depends(get_redis),
    redis_bin: Redis = Depends(get_redis_bin),
):
    try:
        xray_bytes = await xray.read()
        if not xray_bytes:
            raise HTTPException(status_code=400, detail="Empty xray upload")

        xray_ct = xray.content_type or "application/octet-stream"

        if gradcam is not None:
            gradcam_bytes = await gradcam.read()
            gradcam_ct = gradcam.content_type or "application/octet-stream"
        else:
            gradcam_bytes = b""
            gradcam_ct = "application/octet-stream"

        case_id = await record_store.create_record(
            redis,
            redis_bin,
            student_id=student_id,
            notes=notes,
            pred_label=pred_label,
            pred_accuracy=pred_accuracy,
            xray_bytes=xray_bytes,
            xray_content_type=xray_ct,
            gradcam_bytes=gradcam_bytes,
            gradcam_content_type=gradcam_ct,
        )

        record = await record_store.get_record(redis, case_id=case_id)
        return _record_to_out(record)

    except record_store.InternNotFoundForRecordError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("", response_model=PatientRecordOut, status_code=status.HTTP_201_CREATED)
async def create_record(
    payload: PatientRecordSaveIn, 
    student_id: str = Depends(require_intern),
    redis: Redis = Depends(get_redis),
    redis_bin: Redis = Depends(get_redis_bin),
):
    """
    SAVE: promote temp record to permanent case_id record.
    """
    try:
        case_id = await promote_temp_record(
            redis, redis_bin,
            temp_id=payload.temp_id,
            student_id=student_id,
            notes=payload.notes,
        )
        record = await record_store.get_record(redis, case_id=case_id)
        return _record_to_out(record)

    except TempRecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except TempRecordOwnershipError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except TempRecordInvalidError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get(
    "",
    response_model=list[PatientRecordOut],
    dependencies=[Depends(require_admin)],
)
async def list_all_records(redis: Redis = Depends(get_redis)):
    records = await record_store.list_records(redis)
    return [_record_to_out(r) for r in records]


@router.get(
    "/intern/{student_id}",
    response_model=list[PatientRecordOut],
    dependencies=[Depends(require_admin)]
)
async def list_records_for_intern(student_id: str, redis: Redis = Depends(get_redis)):
    try:
        records = await record_store.list_records_for_intern(redis, student_id=student_id)
        return [_record_to_out(r) for r in records]
    except record_store.InternNotFoundForRecordError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get(
    "/me", 
    response_model=list[PatientRecordOut]
)
async def list_my_intern_records(
    student_id: str = Depends(require_intern),
    redis: Redis = Depends(get_redis),
):
    records = await record_store.list_records_for_intern(redis, student_id=student_id)
    return [_record_to_out(r) for r in records]


@router.get(
    "/{case_id}",
    response_model=PatientRecordOut
)
async def get_record(case_id: str, redis: Redis = Depends(get_redis)):
    try:
        record = await record_store.get_record(redis, case_id=case_id)
        return _record_to_out(record)
    except record_store.RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete(
    "/{case_id}",
    response_model=dict,
    dependencies=[Depends(require_admin)],
)
async def delete_record(
    case_id: str,
    redis: Redis = Depends(get_redis),
    redis_bin: Redis = Depends(get_redis_bin),
):
    try:
        await record_store.delete_record(redis, redis_bin, case_id=case_id)
        return {"status": "deleted", "case_id": case_id}
    except record_store.RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{case_id}/xray")
async def get_xray(
    case_id: str,
    redis: Redis = Depends(get_redis),
    redis_bin: Redis = Depends(get_redis_bin),
):
    try:
        record = await record_store.get_record(redis, case_id=case_id)
    except record_store.RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    data = await image_store.get_xray(redis_bin, case_id=case_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Xray image not found")

    content_type = record.get("xray_content_type", "application/octet-stream")
    return Response(content=data, media_type=content_type)


@router.get("/{case_id}/gradcam")
async def get_gradcam(
    case_id: str,
    redis: Redis = Depends(get_redis),
    redis_bin: Redis = Depends(get_redis_bin),
):
    try:
        record = await record_store.get_record(redis, case_id=case_id)
    except record_store.RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    data = await image_store.get_gradcam(redis_bin, case_id=case_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Gradcam image not found")

    content_type = record.get("gradcam_content_type", "application/octet-stream")
    return Response(content=data, media_type=content_type)
