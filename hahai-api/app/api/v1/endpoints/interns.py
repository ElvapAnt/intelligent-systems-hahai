from fastapi import APIRouter, Depends, HTTPException, status
from redis.asyncio.client import Redis

from app.api.dependencies import get_redis, require_admin
from app.schemas.intern import InternCreate, InternOut
from app.services.storage import interns as intern_store

router = APIRouter()

@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_intern(payload: InternCreate, redis: Redis = Depends(get_redis)):
    try:
        await intern_store.create_intern(
            redis,
            student_id=payload.student_id,
            name=payload.name,
            surname=payload.surname,
        )
        return {"status": "created", "student_id": payload.student_id}
    except intern_store.InternAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get(
    "",
    response_model=list[InternOut],
    dependencies=[Depends(require_admin)],
)
async def list_interns(redis: Redis = Depends(get_redis)):
    return await intern_store.list_interns(redis)


@router.get(
    "/{student_id}",
    response_model=InternOut,
    dependencies=[Depends(require_admin)],
)
async def get_intern(student_id: str, redis: Redis = Depends(get_redis)):
    try:
        return await intern_store.get_intern(redis, student_id=student_id)
    except intern_store.InternNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete(
    "/{student_id}",
    response_model=dict,
    dependencies=[Depends(require_admin)],
)
async def delete_intern(student_id: str, redis: Redis = Depends(get_redis)):
    try:
        await intern_store.delete_intern(redis, student_id=student_id)
        return {"status": "deleted", "student_id": student_id}
    except intern_store.InternNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except intern_store.InternHasRecordsError as e:
        raise HTTPException(status_code=409, detail=str(e))
