from __future__ import annotations

from redis.asyncio.client import Redis

from app.db.keys import record_gradcam_key, record_xray_key


async def save_xray(redis_bin: Redis, *, case_id: str, data: bytes) -> None:
    await redis_bin.set(record_xray_key(case_id), data)


async def save_gradcam(redis_bin: Redis, *, case_id: str, data: bytes) -> None:
    await redis_bin.set(record_gradcam_key(case_id), data)


async def get_xray(redis_bin: Redis, *, case_id: str) -> bytes | None:
    return await redis_bin.get(record_xray_key(case_id))


async def get_gradcam(redis_bin: Redis, *, case_id: str) -> bytes | None:
    return await redis_bin.get(record_gradcam_key(case_id))


async def delete_images(redis_bin: Redis, *, case_id: str) -> None:
    await redis_bin.delete(record_xray_key(case_id), record_gradcam_key(case_id))
