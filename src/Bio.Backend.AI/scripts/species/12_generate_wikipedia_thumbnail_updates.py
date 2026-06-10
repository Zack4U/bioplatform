from __future__ import annotations

"""
Script 12: Generate Wikipedia Thumbnail SQL Updates
===================================================
Reads all species from PostgreSQL (scientific catalog), searches for a
representative image on Wikipedia, and generates an SQL file with UPDATE
statements for species.thumbnail_url.

Usage:
    python scripts/species/12_generate_wikipedia_thumbnail_updates.py
    python scripts/species/12_generate_wikipedia_thumbnail_updates.py --limit 100
    python scripts/species/12_generate_wikipedia_thumbnail_updates.py --replace-existing

Outputs:
    - data/species_catalog/species_thumbnail_wikipedia_updates.sql
    - data/species_catalog/species_thumbnail_wikipedia_report.json
"""

import argparse
import asyncio
import json
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import asyncpg
import requests

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
WIKIMEDIA_COMMONS_API = "https://commons.wikimedia.org/w/api.php"
FAST_REQUEST_TIMEOUT = 6
DEEP_REQUEST_TIMEOUT = 20
RUNTIME_MODE = "fast"

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
OUTPUT_DIR = PROJECT_ROOT / "data" / "species_catalog"

# Ensure app package imports work when running this file directly.
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.core.config import get_settings  # noqa: E402

DEFAULT_SQL_OUTPUT = OUTPUT_DIR / "species_thumbnail_wikipedia_updates.sql"
DEFAULT_REPORT_OUTPUT = OUTPUT_DIR / "species_thumbnail_wikipedia_report.json"


@dataclass
class SpeciesRow:
    id: str
    scientific_name: str
    thumbnail_url: str | None


@dataclass
class MatchResult:
    image_url: str | None
    page_title: str | None
    source: str


def api_get_json(
    session: requests.Session,
    url: str,
    params: dict[str, Any],
    max_attempts: int = 3,
) -> dict[str, Any] | None:
    if RUNTIME_MODE == "fast":
        max_attempts = 1

    timeout = FAST_REQUEST_TIMEOUT if RUNTIME_MODE == "fast" else DEEP_REQUEST_TIMEOUT
    for attempt in range(max_attempts):
        try:
            response = session.get(url, params=params, timeout=timeout)
        except requests.RequestException:
            # Network/transient errors: short backoff and retry.
            time.sleep(min(2**attempt, 2.0))
            continue

        if response.status_code in (429, 503):
            if RUNTIME_MODE == "fast":
                return None
            retry_after_raw = response.headers.get("Retry-After")
            retry_after = 0
            if isinstance(retry_after_raw, str) and retry_after_raw.isdigit():
                retry_after = int(retry_after_raw)
            wait_seconds = retry_after if retry_after > 0 else min(2**attempt, 2.0)
            wait_seconds = min(wait_seconds, 4.0)
            time.sleep(wait_seconds)
            continue

        if response.status_code >= 400:
            return None

        try:
            payload = response.json()
        except ValueError:
            return None

        if isinstance(payload, dict):
            return payload
        return None

    return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate SQL updates for species.thumbnail_url using Wikipedia images."
        )
    )
    parser.add_argument(
        "--output-sql",
        type=Path,
        default=DEFAULT_SQL_OUTPUT,
        help=f"SQL output path (default: {DEFAULT_SQL_OUTPUT})",
    )
    parser.add_argument(
        "--output-report",
        type=Path,
        default=DEFAULT_REPORT_OUTPUT,
        help=f"JSON report path (default: {DEFAULT_REPORT_OUTPUT})",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of species to process (debug/dry run).",
    )
    parser.add_argument(
        "--scientific-name",
        type=str,
        default=None,
        help="Process only one exact scientific_name (case-insensitive).",
    )
    parser.add_argument(
        "--replace-existing",
        action="store_true",
        help="Replace existing thumbnail_url values. Default: update only NULL/empty.",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.15,
        help="Delay (seconds) between Wikipedia requests.",
    )
    parser.add_argument(
        "--mode",
        choices=["fast", "deep"],
        default="fast",
        help=(
            "Lookup mode: fast (direct page + commons scrape) or deep "
            "(adds extra API fallbacks, slower)."
        ),
    )
    return parser.parse_args()


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


async def fetch_species(
    limit: int | None, scientific_name: str | None
) -> list[SpeciesRow]:
    settings = get_settings()
    conn = await asyncpg.connect(dsn=settings.pg_dsn_sync)

    query = """
        SELECT id::text AS id,
               scientific_name,
               thumbnail_url
        FROM species
        WHERE scientific_name IS NOT NULL
          AND btrim(scientific_name) <> ''
    """

    params: list[Any] = []

    if scientific_name:
        params.append(scientific_name)
        query += "\n  AND lower(scientific_name) = lower($1)"

    query += "\nORDER BY scientific_name ASC"

    if limit is not None:
        params.append(limit)
        query += f"\nLIMIT ${len(params)}"

    rows = await conn.fetch(query, *params)

    await conn.close()
    result = [
        SpeciesRow(
            id=row["id"],
            scientific_name=row["scientific_name"],
            thumbnail_url=row["thumbnail_url"],
        )
        for row in rows
    ]
    return result


def get_page_image(session: requests.Session, title: str) -> MatchResult:
    params = {
        "action": "query",
        "format": "json",
        "redirects": 1,
        "prop": "pageimages|info",
        "piprop": "original",
        "inprop": "url",
        "titles": title,
    }

    payload = api_get_json(session, WIKIPEDIA_API, params)
    if payload is None:
        return MatchResult(None, None, "error")

    pages = payload.get("query", {}).get("pages", {})
    if not isinstance(pages, dict):
        return MatchResult(None, None, "not_found")

    for page in pages.values():
        if "missing" in page:
            continue

        image_url = page.get("original", {}).get("source")
        page_title = page.get("title")
        if image_url:
            image_url = normalize_image_url(image_url)
            return MatchResult(image_url, page_title, "title")

    return MatchResult(None, None, "not_found")


def search_candidate_titles(
    session: requests.Session, scientific_name: str
) -> list[str]:
    params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": f'"{scientific_name}" species',
        "srlimit": 5,
        "srwhat": "text",
    }

    payload = api_get_json(session, WIKIPEDIA_API, params)
    if payload is None:
        return []

    search_results = payload.get("query", {}).get("search", [])
    titles: list[str] = []

    for item in search_results:
        title = item.get("title")
        if isinstance(title, str) and title.strip():
            titles.append(title.strip())

    return titles


def normalize_image_url(url: str) -> str:
    # Keep Wikimedia URLs in HTTPS to avoid mixed content/redirect overhead.
    if url.startswith("http://upload.wikimedia.org"):
        return "https://" + url[len("http://") :]
    return url


def de_thumb_wikimedia_url(url: str) -> str:
    # Convert Wikimedia thumb URL to original file URL when possible.
    marker = "/wikipedia/commons/thumb/"
    if marker not in url:
        return url

    prefix, rest = url.split(marker, 1)
    parts = rest.split("/")
    if len(parts) < 4:
        return url

    # Thumb form: /thumb/<hash1>/<hash2>/<filename>/<size>-<filename>
    filename = parts[-2]
    original_rest = "/".join(parts[:-2] + [filename])
    return f"{prefix}/wikipedia/commons/{original_rest}"


def get_commons_file_image(session: requests.Session, file_title: str) -> MatchResult:
    params = {
        "action": "query",
        "format": "json",
        "prop": "imageinfo",
        "iiprop": "url",
        "titles": file_title,
    }

    payload = api_get_json(session, WIKIMEDIA_COMMONS_API, params)
    if payload is None:
        return MatchResult(None, None, "error")

    pages = payload.get("query", {}).get("pages", {})
    if not isinstance(pages, dict):
        return MatchResult(None, None, "not_found")

    for page in pages.values():
        if "missing" in page:
            continue

        image_info = page.get("imageinfo", [])
        if not isinstance(image_info, list) or not image_info:
            continue

        image_url = image_info[0].get("url")
        title = page.get("title")
        if isinstance(image_url, str) and image_url.strip():
            return MatchResult(normalize_image_url(image_url), title, "commons_file")

    return MatchResult(None, None, "not_found")


def search_commons_file_titles(
    session: requests.Session, scientific_name: str
) -> list[str]:
    queries = [
        f'"{scientific_name}" filetype:bitmap',
        scientific_name,
    ]
    seen: set[str] = set()
    titles: list[str] = []

    for srquery in queries:
        params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srnamespace": 6,
            "srlimit": 12,
            "srsearch": srquery,
        }

        payload = api_get_json(session, WIKIMEDIA_COMMONS_API, params)
        if payload is None:
            continue

        search_results = payload.get("query", {}).get("search", [])
        for item in search_results:
            title = item.get("title")
            if not isinstance(title, str):
                continue
            normalized = title.strip()
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            titles.append(normalized)

    return titles


def search_commons_media_html(
    session: requests.Session, scientific_name: str
) -> MatchResult:
    params = {
        "search": scientific_name,
        "title": "Special:MediaSearch",
        "type": "image",
    }

    timeout = FAST_REQUEST_TIMEOUT if RUNTIME_MODE == "fast" else DEEP_REQUEST_TIMEOUT
    try:
        response = session.get(
            "https://commons.wikimedia.org/w/index.php",
            params=params,
            timeout=timeout,
        )
        if response.status_code >= 400:
            return MatchResult(None, None, "error")
        html = response.text
    except requests.RequestException:
        return MatchResult(None, None, "error")

    # Capture direct upload URLs from rendered HTML/JSON payload snippets.
    raw_urls = re.findall(
        r"https://upload\.wikimedia\.org[^\"'\s]+\.(?:jpg|jpeg|png|webp)",
        html,
        flags=re.IGNORECASE,
    )

    if not raw_urls:
        return MatchResult(None, None, "not_found")

    candidates: list[str] = []
    seen: set[str] = set()
    for raw in raw_urls:
        cleaned = normalize_image_url(de_thumb_wikimedia_url(raw))
        lowered = cleaned.lower()

        # De-prioritize non-photographic assets.
        if "_map." in lowered or "distribution" in lowered or "range" in lowered:
            continue

        if cleaned in seen:
            continue
        seen.add(cleaned)
        candidates.append(cleaned)

    if not candidates:
        fallback = normalize_image_url(de_thumb_wikimedia_url(raw_urls[0]))
        return MatchResult(fallback, "Wikimedia Commons MediaSearch", "commons_scrape")

    return MatchResult(candidates[0], "Wikimedia Commons MediaSearch", "commons_scrape")


def find_species_image(
    session: requests.Session,
    scientific_name: str,
    mode: str,
) -> MatchResult:
    if mode == "fast":
        commons_scrape = search_commons_media_html(session, scientific_name)
        if commons_scrape.image_url:
            return commons_scrape

        # Fallback to direct Wikipedia page image only if scraping fails.
        direct = get_page_image(session, scientific_name)
        if direct.image_url:
            return direct

        return MatchResult(None, None, "not_found")

    direct = get_page_image(session, scientific_name)
    if direct.image_url:
        return direct

    commons_scrape = search_commons_media_html(session, scientific_name)
    if commons_scrape.image_url:
        return commons_scrape

    candidates = search_candidate_titles(session, scientific_name)
    for candidate in candidates:
        result = get_page_image(session, candidate)
        if result.image_url:
            return MatchResult(result.image_url, result.page_title, "search")

    commons_titles = search_commons_file_titles(session, scientific_name)
    for file_title in commons_titles:
        result = get_commons_file_image(session, file_title)
        if result.image_url:
            return MatchResult(result.image_url, result.page_title, "commons_search")

    return MatchResult(None, None, "not_found")


def should_update_species(species: SpeciesRow, replace_existing: bool) -> bool:
    if replace_existing:
        return True
    return not species.thumbnail_url or not species.thumbnail_url.strip()


def build_sql(rows: list[dict[str, str]]) -> str:
    lines: list[str] = [
        "-- Auto-generated by scripts/species/12_generate_wikipedia_thumbnail_updates.py",
        "-- Review before applying in non-development environments.",
        "BEGIN;",
        "",
    ]

    for row in rows:
        lines.append(
            "UPDATE species "
            f"SET thumbnail_url = {sql_quote(row['image_url'])}, "
            "updated_at = NOW() "
            f"WHERE id = {sql_quote(row['id'])};"
        )

    lines.extend(
        [
            "",
            "COMMIT;",
        ]
    )

    return "\n".join(lines) + "\n"


def main() -> None:
    args = parse_args()
    global RUNTIME_MODE
    RUNTIME_MODE = args.mode
    args.output_sql.parent.mkdir(parents=True, exist_ok=True)
    args.output_report.parent.mkdir(parents=True, exist_ok=True)

    print("[INFO] Loading species from PostgreSQL...")
    species_rows = asyncio.run(fetch_species(args.limit, args.scientific_name))
    print(f"[INFO] Species loaded: {len(species_rows)}")

    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "BioPlatform-Caldas/1.0 (species-thumbnail-updater)",
            "Accept": "application/json",
        }
    )

    updates: list[dict[str, str]] = []
    report_rows: list[dict[str, Any]] = []
    started_at = time.time()

    for index, species in enumerate(species_rows, start=1):
        update_allowed = should_update_species(species, args.replace_existing)
        if not update_allowed:
            report_rows.append(
                {
                    "id": species.id,
                    "scientific_name": species.scientific_name,
                    "status": "skipped_existing",
                    "existing_thumbnail_url": species.thumbnail_url,
                    "wikipedia_page": None,
                    "image_url": None,
                }
            )
            continue

        match = find_species_image(session, species.scientific_name, args.mode)

        if match.image_url:
            updates.append(
                {
                    "id": species.id,
                    "scientific_name": species.scientific_name,
                    "image_url": match.image_url,
                }
            )
            status = "matched"
        else:
            status = "not_found"

        report_rows.append(
            {
                "id": species.id,
                "scientific_name": species.scientific_name,
                "status": status,
                "existing_thumbnail_url": species.thumbnail_url,
                "wikipedia_page": match.page_title,
                "image_url": match.image_url,
                "source": match.source,
            }
        )

        if index % 25 == 0:
            elapsed = max(time.time() - started_at, 0.001)
            rate = index / elapsed
            remaining = len(species_rows) - index
            eta_seconds = int(remaining / max(rate, 0.001))
            eta_minutes = eta_seconds // 60
            eta_secs = eta_seconds % 60
            print(
                f"[INFO] Processed {index}/{len(species_rows)} | "
                f"rate={rate:.2f} species/s | "
                f"ETA={eta_minutes:02d}:{eta_secs:02d}"
            )

        if args.sleep > 0:
            time.sleep(args.sleep)

    sql_text = build_sql(updates)
    args.output_sql.write_text(sql_text, encoding="utf-8")

    summary = {
        "total_species": len(species_rows),
        "updates_generated": len(updates),
        "replace_existing": args.replace_existing,
        "mode": args.mode,
        "sql_output": str(args.output_sql),
        "rows": report_rows,
    }
    args.output_report.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"[INFO] SQL written: {args.output_sql}")
    print(f"[INFO] Report written: {args.output_report}")
    print(
        f"[INFO] Summary: total={len(species_rows)}, "
        f"updates={len(updates)}, "
        f"skipped_or_not_found={len(species_rows) - len(updates)}"
    )


if __name__ == "__main__":
    main()
