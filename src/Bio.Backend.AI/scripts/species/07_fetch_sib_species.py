from __future__ import annotations

"""
Script 07: Fetch Species Data from SIB Colombia Catálogo API
=============================================================
Reads species list from per_class_metrics.csv and fetches taxonomy,
descriptions, conservation status, and images from the SIB Colombia
Biodiversity Catalog API.

Uso:
    python scripts/species/07_fetch_sib_species.py
    python scripts/species/07_fetch_sib_species.py --limit 5   # dry-run

Salida:
    - data/species_catalog/species_import.csv
    - data/species_catalog/species_full_detail.json
    - data/species_catalog/fetch_report.txt
"""

import argparse
import csv
import json
import sys
import time
import unicodedata
import re
from collections import Counter
from pathlib import Path
from typing import Any, Optional

try:
    import requests
except ImportError:
    print("[ERROR] 'requests' package is required. Install with: pip install requests")
    sys.exit(1)

# ── Resolve paths ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent                    # Bio.Backend.AI/
METRICS_CSV = PROJECT_ROOT / "data" / "evaluation" / "per_class_metrics.csv"
OUTPUT_DIR = PROJECT_ROOT / "data" / "species_catalog"
CHECKPOINT_FILE = OUTPUT_DIR / "_checkpoint.json"

# ── API config ─────────────────────────────────────────────────────
API_BASE = "https://api.catalogo.biodiversidad.co"
SEARCH_URL = f"{API_BASE}/record_search/search"
RECORD_URL = f"{API_BASE}/record"
REQUEST_DELAY = 0.3  # seconds between requests
REQUEST_TIMEOUT = 15  # seconds

# ── CSV columns matching SpeciesCsvRecord.cs + Slug ────────────────
CSV_COLUMNS = [
    "Kingdom", "Phylum", "Class", "Order", "Family", "Genus",
    "ScientificName", "CommonName", "Slug", "Description",
    "ConservationStatus", "TraditionalUses", "IsSensitive", "ThumbnailUrl",
]

# Conservation statuses that mark a species as sensitive
SENSITIVE_STATUSES = {"CR", "EN", "Peligro Crítico", "En Peligro"}


def generate_slug(scientific_name: str) -> str:
    """Generate URL-friendly slug from scientific name.

    Example: 'Vultur gryphus' -> 'vultur-gryphus'
    """
    # Normalize unicode characters
    text = unicodedata.normalize("NFKD", scientific_name)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def read_species_list(filepath: Path) -> list[str]:
    """Read species names from per_class_metrics.csv.

    Returns list of scientific names with underscores replaced by spaces.
    """
    species_names: list[str] = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_name = row.get("species", "").strip()
            if raw_name:
                # Convert "Genus_species" -> "Genus species"
                species_names.append(raw_name.replace("_", " "))
    print(f"[INFO] Read {len(species_names):,} species from {filepath.name}")
    return species_names


def search_species(scientific_name: str) -> Optional[dict]:
    """Search for a species in the SIB Colombia API.

    Returns the first matching record or None.
    The API returns HTTP 406 when no results are found, which is expected.
    """
    try:
        resp = requests.get(
            SEARCH_URL,
            params={"q": scientific_name, "size": 1},
            timeout=REQUEST_TIMEOUT,
        )
        # 406 = "Not found results" — expected for many species
        if resp.status_code == 406:
            return None
        resp.raise_for_status()
        results = resp.json()
        if isinstance(results, list) and len(results) > 0:
            return results[0]
    except requests.RequestException as e:
        print(f"  [WARN] Search error for '{scientific_name}': {e}")
    except (json.JSONDecodeError, KeyError) as e:
        print(f"  [WARN] Invalid response for '{scientific_name}': {e}")
    return None


def fetch_full_record(record_id: str) -> Optional[dict]:
    """Fetch the complete species record from SIB Colombia API."""
    try:
        resp = requests.get(
            f"{RECORD_URL}/{record_id}",
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        print(f"  [WARN] Full record fetch failed for ID '{record_id}': {e}")
    except json.JSONDecodeError as e:
        print(f"  [WARN] Invalid JSON for record '{record_id}': {e}")
    return None


def extract_taxonomy(record: dict) -> dict[str, str]:
    """Extract taxonomy hierarchy from a full record."""
    taxonomy = {
        "Kingdom": "",
        "Phylum": "",
        "Class": "",
        "Order": "",
        "Family": "",
        "Genus": "",
    }
    hierarchy = record.get("hierarchy", [])
    if hierarchy and isinstance(hierarchy, list):
        h = hierarchy[0]
        taxonomy["Kingdom"] = h.get("kingdom", "") or ""
        taxonomy["Phylum"] = h.get("phylum", "") or ""
        taxonomy["Class"] = h.get("classHierarchy", "") or ""
        taxonomy["Order"] = h.get("order", "") or ""
        taxonomy["Family"] = h.get("family", "") or ""
        taxonomy["Genus"] = h.get("genus", "") or ""
    return taxonomy


def extract_common_name(record: dict) -> str:
    """Extract first Spanish common name from record."""
    common_names = record.get("commonNamesAtomized", [])
    if not common_names:
        # Fallback to search-level commonNames
        common_names = record.get("commonNames", [])

    # Prefer Spanish names
    for cn in common_names:
        lang = (cn.get("language") or "").lower()
        name = cn.get("name", "").strip()
        if lang == "español" and name:
            return name

    # Fallback: any name available
    for cn in common_names:
        name = cn.get("name", "").strip()
        if name:
            return name

    return ""


def extract_description(record: dict) -> str:
    """Extract species description, truncated to ~500 chars."""
    # Try fullDescription first
    full_desc = record.get("fullDescription", {})
    text = ""
    if isinstance(full_desc, dict):
        text = full_desc.get("fullDescriptionUnstructured", "") or ""

    # Fallback to abstract
    if not text:
        text = record.get("abstract", "") or ""

    # Truncate to ~500 characters at word boundary
    if len(text) > 500:
        text = text[:497]
        last_space = text.rfind(" ")
        if last_space > 400:
            text = text[:last_space]
        text += "..."

    return text.strip()


def extract_conservation_status(
    record: dict, search_record: Optional[dict] = None
) -> str:
    """Extract conservation/threat status from record."""
    # Try from full record threatStatus list
    threat_statuses = record.get("threatStatus", [])
    status_parts: list[str] = []
    for ts in threat_statuses:
        atomized = ts.get("threatStatusAtomized", {})
        category = atomized.get("threatCategory", {})
        value = category.get("measurementValue", "")
        mtype = category.get("measurementType", "")
        if value and mtype:
            status_parts.append(f"{value} ({mtype})")
        # CITES appendix
        cites = atomized.get("apendiceCITES", [])
        if cites:
            status_parts.append(f"CITES {','.join(cites)}")

    if status_parts:
        return "; ".join(status_parts)

    # Fallback to threatStatusValue from search or advanced_search
    if search_record:
        tsv = search_record.get("threatStatusValue", "")
        if tsv:
            return tsv

    return ""


def extract_traditional_uses(record: dict) -> str:
    """Extract traditional uses from usesManagementAndConservation."""
    uses_section = record.get("usesManagementAndConservation", {})
    if not isinstance(uses_section, dict):
        return ""

    uses_atomized = uses_section.get("usesAtomized", [])
    uses_texts: list[str] = []
    for use in uses_atomized:
        if isinstance(use, dict):
            use_type = use.get("useType", "")
            use_value = use.get("useValue", "")
            if use_type or use_value:
                uses_texts.append(f"{use_type}: {use_value}".strip(": "))

    return "; ".join(uses_texts) if uses_texts else ""


def extract_thumbnail(
    record: dict, search_record: Optional[dict] = None
) -> str:
    """Extract thumbnail/main image URL."""
    # Try from full record ancillaryData
    ancillary = record.get("ancillaryData", [])
    for ad in ancillary:
        if isinstance(ad, dict):
            media_urls = ad.get("mediaURL", [])
            if media_urls and isinstance(media_urls, list) and media_urls[0]:
                return media_urls[0]

    # Try from imageInfo in search record
    if search_record:
        image_info = search_record.get("imageInfo", {})
        if isinstance(image_info, dict):
            main_img = image_info.get("mainImage", "")
            if main_img:
                return main_img

    return ""


def is_sensitive(conservation_status: str) -> bool:
    """Determine if species is sensitive based on conservation status."""
    status_upper = conservation_status.upper()
    for keyword in SENSITIVE_STATUSES:
        if keyword.upper() in status_upper:
            return True
    return False


def process_species(
    scientific_name: str,
) -> tuple[Optional[dict[str, Any]], Optional[dict]]:
    """Process a single species: search + fetch full record.

    Returns (csv_row_dict, full_record) or (None, None) if not found.
    """
    # Step 1: Search
    search_result = search_species(scientific_name)
    if not search_result:
        return None, None

    # Validate that the result matches our species
    result_name = search_result.get("scientificNameSimple", "")
    canonical = (
        search_result.get("taxonRecordNameApprovedInUse", {})
        .get("taxonRecordName", {})
        .get("scientificName", {})
        .get("canonicalName", {})
        .get("simple", "")
    )

    # Check if the canonical name matches (case-insensitive)
    if canonical.lower() != scientific_name.lower():
        # Try partial match (the search might return a subspecies)
        if scientific_name.lower() not in canonical.lower():
            print(
                f"  [WARN] Name mismatch: searched '{scientific_name}', "
                f"got '{canonical}'"
            )
            return None, None

    record_id = search_result.get("_id", "")
    if not record_id:
        return None, None

    time.sleep(REQUEST_DELAY)

    # Step 2: Fetch full record
    full_record = fetch_full_record(record_id)
    if not full_record:
        # Use search result as fallback for basic info
        full_record = search_result

    # Step 3: Extract fields
    taxonomy = extract_taxonomy(full_record)
    common_name = extract_common_name(full_record)
    description = extract_description(full_record)
    conservation = extract_conservation_status(full_record, search_result)
    traditional_uses = extract_traditional_uses(full_record)
    thumbnail = extract_thumbnail(full_record, search_result)
    slug = generate_slug(scientific_name)
    sensitive = is_sensitive(conservation)

    csv_row = {
        **taxonomy,
        "ScientificName": scientific_name,
        "CommonName": common_name,
        "Slug": slug,
        "Description": description,
        "ConservationStatus": conservation,
        "TraditionalUses": traditional_uses,
        "IsSensitive": str(sensitive),
        "ThumbnailUrl": thumbnail,
    }

    return csv_row, full_record


def load_checkpoint() -> dict[str, dict]:
    """Load checkpoint from previous run."""
    if CHECKPOINT_FILE.exists():
        try:
            with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            print(f"[INFO] Loaded checkpoint with {len(data):,} species")
            return data
        except (json.JSONDecodeError, IOError):
            print("[WARN] Checkpoint file corrupted, starting fresh")
    return {}


def save_checkpoint(results: dict[str, dict]) -> None:
    """Save checkpoint for incremental progress."""
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


def save_csv(rows: list[dict], output_path: Path) -> None:
    """Save species data as CSV matching SpeciesCsvRecord.cs columns."""
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    print(f"[INFO] CSV saved to {output_path} ({len(rows)} rows)")


def save_full_detail(details: dict[str, Any], output_path: Path) -> None:
    """Save full API responses as JSON."""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(details, f, ensure_ascii=False, indent=2)
    print(f"[INFO] Full detail JSON saved to {output_path}")


def generate_report(
    species_list: list[str],
    found: list[dict],
    not_found: list[str],
) -> str:
    """Generate human-readable fetch report."""
    total = len(species_list)
    found_count = len(found)
    not_found_count = len(not_found)
    found_pct = (found_count / max(total, 1)) * 100

    kingdom_counts = Counter(row.get("Kingdom", "Unknown") for row in found)
    class_counts = Counter(row.get("Class", "Unknown") for row in found)

    sensitive_count = sum(
        1 for row in found if row.get("IsSensitive") == "True"
    )
    with_thumbnail = sum(
        1 for row in found if row.get("ThumbnailUrl", "")
    )
    with_description = sum(
        1 for row in found if row.get("Description", "")
    )
    with_common_name = sum(
        1 for row in found if row.get("CommonName", "")
    )

    lines = [
        "=" * 60,
        "  SPECIES DATA FETCH REPORT - SIB Colombia API",
        "  Catálogo de la Biodiversidad de Colombia",
        "=" * 60,
        "",
        f"Total species in dataset:     {total:,}",
        f"Found in SIB catalog:         {found_count:,} ({found_pct:.1f}%)",
        f"Not found:                    {not_found_count:,} "
        f"({100 - found_pct:.1f}%)",
        "",
        "─" * 40,
        "DATA COMPLETENESS (found species):",
        "─" * 40,
        f"  With common name:    {with_common_name:4d} / {found_count}",
        f"  With description:    {with_description:4d} / {found_count}",
        f"  With thumbnail:      {with_thumbnail:4d} / {found_count}",
        f"  Marked sensitive:    {sensitive_count:4d} / {found_count}",
        "",
        "─" * 40,
        "SUMMARY BY KINGDOM:",
        "─" * 40,
    ]
    for kingdom, count in kingdom_counts.most_common():
        lines.append(f"  {kingdom:20s} → {count:4d} species")

    lines += ["", "─" * 40, "TOP 10 CLASSES:", "─" * 40]
    for cls, count in class_counts.most_common(10):
        lines.append(f"  {cls:25s} → {count:4d} species")

    if not_found:
        lines += ["", "─" * 40, "NOT FOUND SPECIES:", "─" * 40]
        for i, name in enumerate(sorted(not_found), 1):
            lines.append(f"  {i:3d}. {name}")

    lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch species data from SIB Colombia API"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Limit number of species to process (0 = all, for dry-run)",
    )
    parser.add_argument(
        "--no-checkpoint",
        action="store_true",
        help="Ignore checkpoint and start fresh",
    )
    args = parser.parse_args()

    # Verify input file
    if not METRICS_CSV.exists():
        print(f"[ERROR] Input file not found: {METRICS_CSV}")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Read species list
    print("\n[STEP 1/4] Reading species list...")
    species_list = read_species_list(METRICS_CSV)

    if args.limit > 0:
        species_list = species_list[:args.limit]
        print(f"[INFO] Limited to {args.limit} species (dry-run mode)")

    # 2. Load checkpoint
    print("\n[STEP 2/4] Loading checkpoint...")
    if args.no_checkpoint:
        checkpoint: dict[str, dict] = {}
        print("[INFO] Checkpoint ignored (fresh start)")
    else:
        checkpoint = load_checkpoint()

    # 3. Fetch species data
    print("\n[STEP 3/4] Fetching species data from SIB Colombia API...")
    found_rows: list[dict] = []
    not_found: list[str] = []
    full_details: dict[str, Any] = {}
    total = len(species_list)

    for i, species_name in enumerate(species_list, 1):
        progress = f"[{i}/{total}]"

        # Check checkpoint
        if species_name in checkpoint:
            cached = checkpoint[species_name]
            if cached.get("found"):
                found_rows.append(cached["csv_row"])
                full_details[species_name] = cached.get("detail", {})
                print(f"  {progress} {species_name} → cached ✓")
            else:
                not_found.append(species_name)
                print(f"  {progress} {species_name} → cached ✗")
            continue

        print(f"  {progress} Searching: {species_name}...", end=" ")

        csv_row, full_record = process_species(species_name)

        if csv_row is not None:
            found_rows.append(csv_row)
            full_details[species_name] = full_record
            checkpoint[species_name] = {
                "found": True,
                "csv_row": csv_row,
                "detail": {},  # Don't save full detail in checkpoint (too large)
            }
            common = csv_row.get("CommonName", "")
            status = csv_row.get("ConservationStatus", "")
            info = f"'{common}'" if common else "no common name"
            if status:
                info += f" | {status}"
            print(f"✓ ({info})")
        else:
            not_found.append(species_name)
            checkpoint[species_name] = {"found": False}
            print("✗ (not found)")

        # Save checkpoint periodically
        if i % 50 == 0:
            save_checkpoint(checkpoint)
            print(f"  [CHECKPOINT] Saved progress ({i}/{total})")

        time.sleep(REQUEST_DELAY)

    # Final checkpoint save
    save_checkpoint(checkpoint)

    # 4. Save outputs
    print(f"\n[STEP 4/4] Saving outputs to {OUTPUT_DIR}...")

    # CSV for SpeciesImportJob
    csv_path = OUTPUT_DIR / "species_import.csv"
    save_csv(found_rows, csv_path)

    # Full detail JSON
    json_path = OUTPUT_DIR / "species_full_detail.json"
    save_full_detail(full_details, json_path)

    # Report
    report = generate_report(species_list, found_rows, not_found)
    report_path = OUTPUT_DIR / "fetch_report.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"[INFO] Report saved to {report_path}")

    # Print report
    print("\n" + report)

    print(f"\n✅ Species data fetch complete! Outputs in: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
