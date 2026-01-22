import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from redis.asyncio.client import Redis

from app.api.dependencies import get_redis
from app.db.keys import intern_key, intern_session_key
from app.config import settings

router = APIRouter()

class InternLogin(BaseModel):
    student_id: str

@router.post("/intern/login")
async def intern_login(payload: InternLogin, redis: Redis = Depends(get_redis)):
    if not await redis.exists(intern_key(payload.student_id)):
        raise HTTPException(status_code=403, detail="Unknown student_id")

    token = str(uuid.uuid4())
    await redis.set(intern_session_key(token), payload.student_id, ex=settings.SESSION_TTL_SECONDS)

    return {"token": token}
