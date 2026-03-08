"""
Tests for app.core.database — engine/session creation and health check.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.database import (
    _get_engine,
    _get_session_factory,
    check_db_connection,
    dispose_engine,
)


class TestGetEngine:
    """Test engine creation."""

    def test_creates_engine(self):
        with (
            patch("app.core.database._engine", None),
            patch("app.core.database.get_settings") as mock_settings,
            patch("app.core.database.create_async_engine") as mock_create,
        ):
            mock_settings.return_value.pg_dsn = "postgresql+asyncpg://u:p@h:5433/db"
            mock_settings.return_value.debug = False
            result = _get_engine()
            mock_create.assert_called_once()
            assert result is not None

    def test_reuses_engine(self):
        sentinel = MagicMock()
        with patch("app.core.database._engine", sentinel):
            result = _get_engine()
            assert result is sentinel


class TestGetSessionFactory:
    """Test session factory creation."""

    def test_creates_factory(self):
        with (
            patch("app.core.database._session_factory", None),
            patch("app.core.database._get_engine", return_value=MagicMock()),
            patch("app.core.database.async_sessionmaker") as mock_factory,
        ):
            mock_factory.return_value = MagicMock()
            result = _get_session_factory()
            mock_factory.assert_called_once()
            assert result is not None

    def test_reuses_factory(self):
        sentinel = MagicMock()
        with patch("app.core.database._session_factory", sentinel):
            result = _get_session_factory()
            assert result is sentinel


class TestCheckDbConnection:
    """Test DB health check."""

    @pytest.mark.asyncio
    async def test_connection_success(self):
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar.return_value = 1
        mock_session.execute.return_value = mock_result

        with patch("app.core.database.get_db_session") as mock_ctx:
            mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)
            result = await check_db_connection()
            assert result is True

    @pytest.mark.asyncio
    async def test_connection_failure(self):
        with patch("app.core.database.get_db_session") as mock_ctx:
            mock_ctx.return_value.__aenter__ = AsyncMock(
                side_effect=ConnectionError("DB down"),
            )
            mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)
            result = await check_db_connection()
            assert result is False


class TestDisposeEngine:
    """Test engine disposal."""

    @pytest.mark.asyncio
    async def test_dispose_when_engine_exists(self):
        mock_engine = AsyncMock()
        with (
            patch("app.core.database._engine", mock_engine),
            patch("app.core.database._session_factory", MagicMock()),
        ):
            await dispose_engine()
            mock_engine.dispose.assert_called_once()

    @pytest.mark.asyncio
    async def test_dispose_when_no_engine(self):
        with patch("app.core.database._engine", None):
            await dispose_engine()  # should not raise
