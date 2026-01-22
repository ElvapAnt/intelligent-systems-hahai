from fastapi import Header, Request
from redis.asyncio.client import Redis

from app.auth import validate_rfzo
from app.config import settings

def get_redis(request: Request) -> Redis:
    return request.app.state.redis  # decode_responses=True

def get_redis_bin(request: Request) -> Redis:
    return request.app.state.redis_bin  # decode_responses=False

def require_admin(x_rfzo: str | None = Header(default=None, alias="X-RFZO")) -> None:
    validate_rfzo(provided=x_rfzo, expected=settings.ADMIN_RFZO)