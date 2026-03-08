"""
Core Settings — BioPlatform AI Service
========================================
Centralized configuration loaded from environment variables.
Uses pydantic-settings for validation and type coercion.

Secrets MUST live in .env (never hardcoded).
"""

from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        protected_namespaces=(),
    )

    # ── Service ────────────────────────────────────────────────
    app_name: str = "BioPlatform AI Service"
    app_version: str = "1.0.0"
    debug: bool = False
    log_level: str = "INFO"

    # ── PostgreSQL (BioCommerce_Scientific) ────────────────────
    pg_host: str = "localhost"
    pg_port: int = 5432
    pg_user: str = "postgres"
    pg_password: str = "postgres"
    pg_database: str = "biocommerce_scientific"

    # ── CNN Model ──────────────────────────────────────────────
    model_weights_path: str = "data/weights/best_model.pth"
    bio_min_f1_threshold: float = 0.65

    # ── CORS ───────────────────────────────────────────────────
    cors_origins: str = "*"

    # ── OpenAI (for future RAG) ────────────────────────────────
    openai_api_key: Optional[str] = None

    @property
    def pg_dsn(self) -> str:
        """Async PostgreSQL connection string for asyncpg."""
        return (
            f"postgresql+asyncpg://{self.pg_user}:{self.pg_password}"
            f"@{self.pg_host}:{self.pg_port}/{self.pg_database}"
        )

    @property
    def pg_dsn_sync(self) -> str:
        """Sync PostgreSQL connection string (for migrations / scripts)."""
        return (
            f"postgresql://{self.pg_user}:{self.pg_password}"
            f"@{self.pg_host}:{self.pg_port}/{self.pg_database}"
        )


@lru_cache
def get_settings() -> Settings:
    """Singleton settings instance (cached after first call)."""
    return Settings()
