import redis.asyncio as redis_async
from redis.asyncio.client import Redis

async def create_redis_text(redis_url: str) -> Redis:
    r = redis_async.from_url(redis_url, decode_responses=True)
    await r.ping() #type:ignore
    return r


async def create_redis_binary(redis_url: str) -> Redis:
    r = redis_async.from_url(redis_url, decode_responses=False)
    await r.ping() #type:ignore
    return r
