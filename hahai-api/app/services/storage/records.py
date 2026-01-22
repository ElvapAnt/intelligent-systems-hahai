from __future__ import annotations

import time
import uuid

from redis.asyncio.client import Redis

from app.db.keys import ALL_RECORDS_KEY, intern_key, intern_records_key, record_key
from app.services.storage.images import delete_images, save_gradcam, save_xray


class RecordNotFoundError(Exception):
    pass


class InternNotFoundForRecordError(Exception):
    pass


async def create_record(
    redis: Redis,          # text client
    redis_bin: Redis,      # binary client
    *,
    student_id: str,
    notes: str,
    pred_label: str,
    pred_accuracy: float,
    xray_bytes: bytes,
    xray_content_type: str,
    gradcam_bytes: bytes,
    gradcam_content_type: str,
) -> str:
    if not await redis.exists(intern_key(student_id)):
        raise InternNotFoundForRecordError(f"Intern {student_id} not found")

    case_id = str(uuid.uuid4())
    now = int(time.time())

    # 1) write metadata + indexes (text)
    pipe = redis.pipeline()
    pipe.hset(record_key(case_id), mapping={
        "case_id": case_id,
        "student_id": student_id,
        "notes": notes,
        "pred_label": pred_label,
        "pred_accuracy": float(pred_accuracy),
        "created_at": now,
        "xray_content_type": xray_content_type,
        "gradcam_content_type": gradcam_content_type,
    })
    pipe.sadd(ALL_RECORDS_KEY, case_id)
    pipe.sadd(intern_records_key(student_id), case_id)
    await pipe.execute()

    # 2) write images (binary)
    try:
        await save_xray(redis_bin, case_id=case_id, data=xray_bytes)
        await save_gradcam(redis_bin, case_id=case_id, data=gradcam_bytes)
    except Exception:
        # cleanup to avoid dangling metadata without images
        await delete_record(redis, redis_bin, case_id=case_id)
        raise

    return case_id


async def get_record(redis: Redis, *, case_id: str) -> dict:
    data = await redis.hgetall(record_key(case_id)) #type:ignore
    if not data:
        raise RecordNotFoundError(f"Record {case_id} not found")

    # Ensure types are nice (redis returns str for everything in decode_responses=True)
    return {
        "case_id": data.get("case_id", case_id),
        "student_id": data.get("student_id", ""),
        "notes": data.get("notes", ""),
        "pred_label": data.get("pred_label", ""),
        "pred_accuracy": float(data.get("pred_accuracy", 0.0)),
        "created_at": int(float(data.get("created_at", 0))),
        "xray_content_type": data.get("xray_content_type", "image/png"),
        "gradcam_content_type": data.get("gradcam_content_type", "image/png"),
    }


async def list_records(redis: Redis) -> list[dict]:
    ids = await redis.smembers(ALL_RECORDS_KEY) #type:ignore
    case_ids = sorted(list(ids))

    out: list[dict] = []
    for cid in case_ids:
        try:
            out.append(await get_record(redis, case_id=cid))
        except RecordNotFoundError:
            continue
    return out


async def list_records_for_intern(redis: Redis, *, student_id: str) -> list[dict]:
    if not await redis.exists(intern_key(student_id)):
        raise InternNotFoundForRecordError(f"Intern {student_id} not found")

    ids = await redis.smembers(intern_records_key(student_id)) #type:ignore
    case_ids = sorted(list(ids))

    out: list[dict] = []
    for cid in case_ids:
        try:
            out.append(await get_record(redis, case_id=cid))
        except RecordNotFoundError:
            continue
    return out


async def delete_record(redis: Redis, redis_bin: Redis, *, case_id: str) -> None:
    data = await redis.hgetall(record_key(case_id)) #type:ignore
    if not data:
        raise RecordNotFoundError(f"Record {case_id} not found")

    student_id = data.get("student_id", "")

    pipe = redis.pipeline()
    pipe.delete(record_key(case_id))
    pipe.srem(ALL_RECORDS_KEY, case_id)
    if student_id:
        pipe.srem(intern_records_key(student_id), case_id)
    await pipe.execute()

    await delete_images(redis_bin, case_id=case_id)
