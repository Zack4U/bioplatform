"""
Database Layer — Async PostgreSQL (BioCommerce_Scientific)
============================================================
Provides async session factory for querying the scientific DB
(species, taxonomy, geographic distributions, prediction logs).

Uses SQLAlchemy 2.0 async with asyncpg driver.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.pg_dsn,
            echo=settings.debug,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
        )
    return _engine


def _get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=_get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async DB session, rolling back on errors."""
    factory = _get_session_factory()
    session = factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def check_db_connection() -> bool:
    """Quick health-check: can we reach PostgreSQL?"""
    try:
        async with get_db_session() as session:
            result = await session.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
            return result.scalar() == 1
    except Exception as exc:
        logger.warning(f"Database health-check failed: {exc}")
        return False


async def dispose_engine() -> None:
    """Dispose the engine pool (call on shutdown)."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
