import redis.asyncio as redis_async
from redis.asyncio.client import Redis

async def create_redis(redis_url: str):
    client: Redis = redis_async.from_url(
        redis_url,
        decode_responses=False,  # future-proof for binary image storage
    )
    await client.ping() #type:ignore
    return client
