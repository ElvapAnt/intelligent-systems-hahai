from contextlib import asynccontextmanager

from fastapi import FastAPI

from api.v1.router import router as v1_router
from config import settings
from db.redis import create_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.redis = await create_redis(settings.REDIS_URL)

    yield

    # Shutdown
    redis = getattr(app.state, "redis", None)
    if redis is not None:
        await redis.aclose()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
app.include_router(v1_router, prefix=settings.API_V1_PREFIX)