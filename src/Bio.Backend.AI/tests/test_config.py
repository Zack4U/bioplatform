"""
Tests for app.core.config — Settings & get_settings singleton.
"""

from app.core.config import Settings, get_settings


class TestSettings:
    """Validate Settings defaults and computed properties."""

    def test_defaults(self):
        s = Settings()
        assert s.app_name == "BioPlatform AI Service"
        assert s.app_version == "1.0.0"
        assert s.debug is False
        assert s.log_level == "INFO"
        assert s.pg_host == "localhost"
        assert s.pg_port == 5432
        assert s.pg_user == "postgres"
        assert s.pg_password == "postgres"
        assert s.pg_database == "biocommerce_scientific"
        assert s.bio_min_f1_threshold == 0.65
        assert s.cors_origins == "*"
        assert s.openai_api_key is None

    def test_pg_dsn_async(self):
        s = Settings(pg_user="u", pg_password="p", pg_host="h", pg_port=1234, pg_database="db")
        assert s.pg_dsn == "postgresql+asyncpg://u:p@h:1234/db"

    def test_pg_dsn_sync(self):
        s = Settings(pg_user="u", pg_password="p", pg_host="h", pg_port=1234, pg_database="db")
        assert s.pg_dsn_sync == "postgresql://u:p@h:1234/db"

    def test_get_settings_returns_instance(self):
        get_settings.cache_clear()
        result = get_settings()
        assert isinstance(result, Settings)
