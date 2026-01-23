from __future__ import annotations

import time
import uuid
import secrets

from redis.asyncio.client import Redis

from app.db.keys import ALL_RECORDS_KEY, intern_key, intern_records_key, record_key, record_xray_key, record_gradcam_key
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



class TempRecordNotFoundError(Exception):
    pass

class TempRecordOwnershipError(Exception):
    pass

class TempRecordInvalidError(Exception):
    pass


def make_temp_id() -> str:
    # “md5-looking” but random and cheap
    return "temp-" + secrets.token_hex(16)


async def create_temp_record(
    redis: Redis,         # text
    redis_bin: Redis,     # binary
    *,
    student_id: str,
    pred_label: str,
    pred_accuracy: float,
    xray_bytes: bytes,
    xray_content_type: str,
    gradcam_bytes: bytes,
    gradcam_content_type: str,
    ttl_seconds: int = 10 * 60,
) -> str:
    """
    Creates a temporary record under record:{temp_id} plus image keys:
      record:{temp_id}:xray
      record:{temp_id}:gradcam
    """
    if not await redis.exists(intern_key(student_id)):
        raise TempRecordInvalidError(f"Intern {student_id} not found")

    temp_id = make_temp_id()
    now = int(time.time())

    # store meta (text)
    await redis.hset(record_key(temp_id), mapping={ # type:ignore
        "case_id": temp_id,
        "student_id": student_id,
        "notes": "",  # not saved yet
        "pred_label": pred_label,
        "pred_accuracy": float(pred_accuracy),
        "created_at": now,
        "is_temp": "1",
        "xray_content_type": xray_content_type,
        "gradcam_content_type": gradcam_content_type,
    })
    await redis.expire(record_key(temp_id), ttl_seconds)

    # store images (binary)
    await redis_bin.set(record_xray_key(temp_id), xray_bytes, ex=ttl_seconds)
    await redis_bin.set(record_gradcam_key(temp_id), gradcam_bytes, ex=ttl_seconds)

    return temp_id


async def cancel_temp_record(
    redis: Redis,
    redis_bin: Redis,
    *,
    temp_id: str,
    student_id: str,
) -> None:
    meta = await redis.hgetall(record_key(temp_id)) # type:ignore
    if not meta:
        return

    if meta.get("student_id") != student_id:
        raise TempRecordOwnershipError("Not your temp record")

    # delete meta + images
    await redis.delete(record_key(temp_id))
    await redis_bin.delete(record_xray_key(temp_id), record_gradcam_key(temp_id))


async def promote_temp_record(
    redis: Redis,
    redis_bin: Redis,
    *,
    temp_id: str,
    student_id: str,
    notes: str,
) -> str:
    """
    Promote:
      record:{temp_id}           -> record:{case_id}
      record:{temp_id}:xray      -> record:{case_id}:xray
      record:{temp_id}:gradcam   -> record:{case_id}:gradcam

    Then:
      - persist (remove TTL)
      - set notes, case_id, is_temp
      - add indexes (records set + intern:{id}:records)
    """
    meta_key = record_key(temp_id)
    meta = await redis.hgetall(meta_key) # type:ignore
    if not meta:
        raise TempRecordNotFoundError("Temp record not found")

    if meta.get("student_id") != student_id:
        raise TempRecordOwnershipError("Not your temp record")

    if meta.get("is_temp") != "1" or not temp_id.startswith("temp-"):
        raise TempRecordInvalidError("Not a temp record")

    # Ensure temp images exist
    if not await redis_bin.exists(record_xray_key(temp_id)):
        raise TempRecordInvalidError("Temp xray image missing")
    if not await redis_bin.exists(record_gradcam_key(temp_id)):
        raise TempRecordInvalidError("Temp gradcam image missing")

    case_id = str(uuid.uuid4())

    # Rename images first (binary), then meta (text). Roll back if meta rename fails.
    xray_src = record_xray_key(temp_id)
    grad_src = record_gradcam_key(temp_id)
    xray_dst = record_xray_key(case_id)
    grad_dst = record_gradcam_key(case_id)

    meta_dst = record_key(case_id)

    # RENAMENX prevents overwriting if something crazy collides
    ok1 = await redis_bin.renamenx(xray_src, xray_dst)
    ok2 = await redis_bin.renamenx(grad_src, grad_dst)
    if not ok1 or not ok2:
        # attempt rollback if partial
        if ok1 and not await redis_bin.exists(xray_src):
            try: await redis_bin.renamenx(xray_dst, xray_src)
            except Exception: pass
        if ok2 and not await redis_bin.exists(grad_src):
            try: await redis_bin.renamenx(grad_dst, grad_src)
            except Exception: pass
        raise TempRecordInvalidError("Failed renaming temp image keys")

    ok_meta = await redis.renamenx(meta_key, meta_dst)
    if not ok_meta:
        # rollback images back to temp
        try: await redis_bin.renamenx(xray_dst, xray_src)
        except Exception: pass
        try: await redis_bin.renamenx(grad_dst, grad_src)
        except Exception: pass
        raise TempRecordInvalidError("Failed promoting temp meta key")

    # Now finalize the record hash
    now = int(time.time())
    await redis.hset(meta_dst, mapping={ # type:ignore
        "case_id": case_id,
        "notes": notes,
        "is_temp": "0",
        "saved_at": now,
    })

    # Remove TTLs so the final record persists
    await redis.persist(meta_dst)
    await redis_bin.persist(xray_dst)
    await redis_bin.persist(grad_dst)

    # Add indexes
    pipe = redis.pipeline()
    pipe.sadd(ALL_RECORDS_KEY, case_id)
    pipe.sadd(intern_records_key(student_id), case_id)
    await pipe.execute()

    return case_id
