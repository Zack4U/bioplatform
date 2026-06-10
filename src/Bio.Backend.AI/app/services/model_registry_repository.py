"""
Model Registry Repository — PostgreSQL Queries
================================================
Reads the AI model registry (``ai_model_versions``) from
BioCommerce_Scientific (PostgreSQL). This table is the single
source of truth for which CNN model is active.

The .NET backend (Clean Architecture) owns writes to this table;
the AI service only reads it to decide which weights to load.

Table columns match EF Core schema (ScientificDbContext):
  - version, model_name, is_active, is_deleted.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import sqlalchemy as sa

from app.core.database import get_db_session

logger = logging.getLogger(__name__)


async def get_active_model_version() -> Optional[dict[str, Any]]:
    """
    Return the currently active, non-deleted model version, or None.

    Only one version can be active at a time (enforced by the .NET
    activation command). If no row is active the CNN must NOT load any
    model — classification stays suspended until an admin activates one.
    """
    query = sa.text("""
        SELECT version, model_name, accuracy_metric
        FROM ai_model_versions
        WHERE is_active = TRUE AND is_deleted = FALSE
        LIMIT 1
    """)

    try:
        async with get_db_session() as session:
            row = (await session.execute(query)).mappings().first()
            return dict(row) if row is not None else None
    except Exception as exc:
        logger.error(f"Failed to query active model version: {exc}")
        return None
