from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.router import router as v1_router
from app.config import settings
from app.db.redis import create_redis_text, create_redis_binary


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.redis = await create_redis_text(settings.REDIS_URL) # metadata
    app.state.redis_bin = await create_redis_binary(settings.REDIS_URL) # images

    yield

    # Shutdown
    redis = getattr(app.state, "redis", None)
    if redis is not None:
        await redis.aclose()
    redis_bin = getattr(app.state, "redis_bin", None)
    if redis_bin is not None:
        await redis_bin.aclose()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
app.include_router(v1_router, prefix=settings.API_V1_PREFIX)