from fastapi import Header, Request
from redis.asyncio.client import Redis

from auth import validate_rfzo
from config import settings

def get_redis(request: Request) -> Redis:
    return request.app.state.redis

def require_admin(x_rfzo: str | None = Header(default=None, alias="X-RFZO")) -> None:
    validate_rfzo(provided=x_rfzo, expected=settings.ADMIN_RFZO)