"""
Species Repository — PostgreSQL Queries
==========================================
Fetches species, taxonomy, and geographic data from
BioCommerce_Scientific (PostgreSQL) for the CNN service.

Follows Data Dictionary (03-Data_Dictionary.md):
  - species, taxonomies, geographic_distributions tables.
  - is_sensitive flag: masks exact coordinates.
"""

from __future__ import annotations

import logging
from typing import Any, Optional
from uuid import UUID

import sqlalchemy as sa

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session

logger = logging.getLogger(__name__)


async def get_species_by_scientific_name(
    scientific_name: str,
) -> Optional[dict[str, Any]]:
    """
    Lookup a species by scientific_name and return enriched data.

    Returns None if the species is not in the database.
    Bio-Safety: if species.is_sensitive is True the exact GPS
    coordinates are masked — only municipality is returned.
    """
    query = sa.text("""
        SELECT
            s.id,
            s.scientific_name,
            s.common_name,
            s.description,
            s.ecological_info,
            s.traditional_uses,
            s.economic_potential,
            s.conservation_status,
            s.is_sensitive,
            s.thumbnail_url,
            t.kingdom,
            t.phylum,
            t.class   AS class_name,
            t."order"  AS order_name,
            t.family,
            t.genus
        FROM species s
        LEFT JOIN taxonomies t ON s.taxonomy_id = t.id
        WHERE LOWER(s.scientific_name) = LOWER(:name)
          AND s.is_active IS NOT FALSE
        LIMIT 1
    """)

    try:
        async with get_db_session() as session:
            row = (await session.execute(query, {"name": scientific_name})).mappings().first()
            if row is None:
                return None

            species_data = dict(row)

            # Fetch geographic distributions
            species_data["distributions"] = await _get_distributions(
                session,
                species_data["id"],
                is_sensitive=species_data.get("is_sensitive", False),
            )

            return species_data

    except Exception as exc:
        logger.error(f"DB query failed for '{scientific_name}': {exc}")
        return None


async def get_species_by_id(species_id: UUID) -> Optional[dict[str, Any]]:
    """Lookup a species by UUID primary key."""
    query = sa.text("""
        SELECT
            s.id,
            s.scientific_name,
            s.common_name,
            s.description,
            s.ecological_info,
            s.traditional_uses,
            s.economic_potential,
            s.conservation_status,
            s.is_sensitive,
            s.thumbnail_url,
            t.kingdom,
            t.phylum,
            t.class   AS class_name,
            t."order"  AS order_name,
            t.family,
            t.genus
        FROM species s
        LEFT JOIN taxonomies t ON s.taxonomy_id = t.id
        WHERE s.id = :sid
          AND s.is_active IS NOT FALSE
        LIMIT 1
    """)

    try:
        async with get_db_session() as session:
            row = (await session.execute(query, {"sid": species_id})).mappings().first()
            if row is None:
                return None

            species_data = dict(row)
            species_data["distributions"] = await _get_distributions(
                session,
                species_data["id"],
                is_sensitive=species_data.get("is_sensitive", False),
            )
            return species_data

    except Exception as exc:
        logger.error(f"DB query failed for id={species_id}: {exc}")
        return None


async def _get_distributions(
    session: AsyncSession,
    species_id: UUID,
    *,
    is_sensitive: bool = False,
) -> list[dict[str, Any]]:
    """
    Return geographic distributions for a species.

    Bio-Safety (Decreto 3016 / Data Dictionary §4.6):
      When is_sensitive=True, exact GPS coordinates are MASKED.
      Only municipality name is returned.
    """
    if is_sensitive:
        query = sa.text("""
            SELECT DISTINCT municipality
            FROM geographic_distributions
            WHERE species_id = :sid
            ORDER BY municipality
        """)
        rows = (await session.execute(query, {"sid": species_id})).mappings().all()
        return [{"municipality": r["municipality"]} for r in rows]

    query = sa.text("""
        SELECT
            municipality,
            ST_Y(location_point::geometry) AS latitude,
            ST_X(location_point::geometry) AS longitude,
            altitude,
            observation_date
        FROM geographic_distributions
        WHERE species_id = :sid
        ORDER BY municipality
    """)
    rows = (await session.execute(query, {"sid": species_id})).mappings().all()
    return [dict(r) for r in rows]


async def log_prediction(
    *,
    user_id: Optional[str],
    image_input_url: str,
    raw_result: dict,
    confidence_score: float,
    predicted_species_id: Optional[str],
    model_version: Optional[str],
    processing_time_ms: Optional[int],
) -> None:
    """Insert a row into prediction_logs for MLOps monitoring."""
    import json

    query = sa.text("""
        INSERT INTO prediction_logs
            (user_id, image_input_url, raw_prediction_result,
             confidence_score, top_prediction_species_id,
             model_version, processing_time_ms)
        VALUES
            (:uid, :img_url, :raw::jsonb,
             :conf, :pred_sid,
             :model_ver, :proc_ms)
    """)

    try:
        async with get_db_session() as session:
            await session.execute(
                query,
                {
                    "uid": user_id,
                    "img_url": image_input_url,
                    "raw": json.dumps(raw_result),
                    "conf": confidence_score,
                    "pred_sid": predicted_species_id,
                    "model_ver": model_version,
                    "proc_ms": processing_time_ms,
                },
            )
    except Exception as exc:
        logger.error(f"Failed to log prediction: {exc}")
