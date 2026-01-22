from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "HaHAI-API"
    API_V1_PREFIX: str = "/api/v1"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Admin auth (simple shared secret)
    # Put the real value in .env as ADMIN_RFZO=...
    ADMIN_RFZO: str = "321200918843"

    SESSION_TTL_SECONDS: int = 12 * 60 * 60  # 12 hours

    MODEL_PATH: str = "model.h5"
    IMAGE_SIZE: int = 512
    ENCODER_LAST_CONV_LAYER: str = "top_activation"
    GRADCAM_ALPHA: float = 0.4


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()