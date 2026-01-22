from __future__ import annotations

from redis.asyncio.client import Redis

from app.db.keys import ALL_INTERNS_KEY, intern_key, intern_records_key


class InternAlreadyExistsError(Exception):
    pass


class InternNotFoundError(Exception):
    pass


class InternHasRecordsError(Exception):
    pass


async def create_intern(redis: Redis, *, student_id: str, name: str, surname: str) -> None:
    ikey = intern_key(student_id)
    rkey = intern_records_key(student_id)

    if await redis.exists(ikey):
        raise InternAlreadyExistsError(f"Intern {student_id} already exists")

    pipe = redis.pipeline()
    pipe.hset(ikey, mapping={
        "student_id": student_id,
        "name": name,
        "surname": surname,
    })
    pipe.sadd(ALL_INTERNS_KEY, student_id)
    # ensure the set exists (optional; sets don't need pre-creation, but harmless)
    pipe.sadd(rkey, "__init__")
    pipe.srem(rkey, "__init__")
    await pipe.execute()


async def get_intern(redis: Redis, *, student_id: str) -> dict:
    data = await redis.hgetall(intern_key(student_id)) #type:ignore
    if not data:
        raise InternNotFoundError(f"Intern {student_id} not found")

    record_ids = await redis.smembers(intern_records_key(student_id)) #type:ignore

    return {
        "student_id": data.get("student_id", student_id),
        "name": data.get("name", ""),
        "surname": data.get("surname", ""),
        "patient_records": sorted(list(record_ids)),
    }


async def list_interns(redis: Redis) -> list[dict]:
    ids = await redis.smembers(ALL_INTERNS_KEY) #type:ignore
    student_ids = sorted(list(ids))

    interns: list[dict] = []
    for sid in student_ids:
        try:
            interns.append(await get_intern(redis, student_id=sid))
        except InternNotFoundError:
            continue
    return interns


async def delete_intern(redis: Redis, *, student_id: str) -> None:
    ikey = intern_key(student_id)
    rkey = intern_records_key(student_id)

    if not await redis.exists(ikey):
        raise InternNotFoundError(f"Intern {student_id} not found")

    record_ids = await redis.smembers(rkey) #type:ignore
    if record_ids:
        raise InternHasRecordsError(f"Intern {student_id} has patient records; delete records first")

    pipe = redis.pipeline()
    pipe.delete(ikey)
    pipe.delete(rkey)
    pipe.srem(ALL_INTERNS_KEY, student_id)
    await pipe.execute()