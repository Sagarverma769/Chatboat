import os
from typing import List, Optional

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Security Platform"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_CHANGE_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    FIRST_SUPERUSER_EMAIL: Optional[str] = None
    FIRST_SUPERUSER_PASSWORD: Optional[str] = None

    # CORS configuration
    BACKEND_CORS_ORIGINS: List[str] = []

    # Database Configuration
    DATABASE_URL: Optional[str] = None
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "app"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    ASYNC_DATABASE_URI: Optional[str] = None

    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )


settings = Settings()


def get_async_database_uri() -> str:
    database_uri = (
        settings.ASYNC_DATABASE_URI
        or settings.DATABASE_URL
        or settings.SQLALCHEMY_DATABASE_URI
        or "sqlite+aiosqlite:///./test.db"
    )
    if database_uri.startswith("postgres://"):
        return database_uri.replace("postgres://", "postgresql+asyncpg://", 1)
    if database_uri.startswith("postgresql://"):
        return database_uri.replace("postgresql://", "postgresql+asyncpg://", 1)
    if database_uri.startswith("postgresql+psycopg2://"):
        return database_uri.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
    if database_uri.startswith("sqlite://"):
        return database_uri.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return database_uri


def get_sync_database_uri() -> str:
    return get_async_database_uri().replace("+asyncpg", "").replace("+aiosqlite", "")


def validate_production_settings() -> None:
    is_vercel = os.getenv("VERCEL") == "1"
    is_production = settings.ENVIRONMENT.lower() in {"production", "prod"}
    if not is_vercel and not is_production:
        return

    if not (settings.DATABASE_URL or settings.ASYNC_DATABASE_URI or settings.SQLALCHEMY_DATABASE_URI):
        raise RuntimeError("Set DATABASE_URL to a persistent Postgres database before starting the production API.")
    if get_async_database_uri().startswith("sqlite"):
        raise RuntimeError("SQLite is not persistent production storage. Configure DATABASE_URL to managed Postgres.")
    if settings.SECRET_KEY == "YOUR_SUPER_SECRET_KEY_HERE_CHANGE_IN_PRODUCTION":
        raise RuntimeError("Set SECRET_KEY to a unique private value before starting the production API.")
