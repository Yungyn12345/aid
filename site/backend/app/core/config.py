from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    project_name: str = "AIDDoc Landing API"
    api_prefix: str = "/api/v1"
    environment: str = "development"
    database_url: str = "sqlite:///./landing.db"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:3001"]
    )
    admin_username: str = "admin"
    admin_password: str = "change-me"
    jwt_secret_key: str = "change-me-too"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 720
    public_rate_limit: str = "20/minute"
    landing_cta_url: str = "https://aiddoc.ru/aideclarant"


@lru_cache
def get_settings() -> Settings:
    return Settings()
