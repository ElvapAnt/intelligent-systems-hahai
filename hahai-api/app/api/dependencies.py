from fastapi import Header, Request, HTTPException
from redis.asyncio.client import Redis

from app.auth import validate_rfzo
from app.config import settings
from app.db.keys import intern_session_key, intern_key

import tensorflow as tf

def get_model(request: Request) -> tf.keras.Model: #type:ignore
    return request.app.state.model

def get_redis(request: Request) -> Redis:
    return request.app.state.redis  # decode_responses=True

def get_redis_bin(request: Request) -> Redis:
    return request.app.state.redis_bin  # decode_responses=False

def require_admin(x_rfzo: str | None = Header(default=None, alias="X-RFZO")) -> None:
    validate_rfzo(provided=x_rfzo, expected=settings.ADMIN_RFZO)


async def require_intern(
    request: Request,
    x_intern_token: str | None = Header(default=None, alias="X-Intern-Token"),
) -> str:
    if not x_intern_token:
        raise HTTPException(status_code=401, detail="Missing X-Intern-Token")

    redis = request.app.state.redis  # text client
    student_id = await redis.get(intern_session_key(x_intern_token))
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    # extra safety: intern still exists
    if not await redis.exists(intern_key(student_id)):
        raise HTTPException(status_code=401, detail="Intern no longer exists")

    return student_id