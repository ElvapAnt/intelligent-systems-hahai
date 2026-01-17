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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()