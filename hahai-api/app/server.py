from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as v1_router
from app.config import settings
from app.db.redis import create_redis_text, create_redis_binary
from app.services.ml.model import load_keras_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.redis = await create_redis_text(settings.REDIS_URL) # metadata
    app.state.redis_bin = await create_redis_binary(settings.REDIS_URL) # images

    app.state.model = load_keras_model(settings.MODEL_PATH)

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

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,      
    allow_methods=["*"],         
    allow_headers=["*"],         
)