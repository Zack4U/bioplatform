from __future__ import annotations

"""
Script 08: Bulk Species Fetch from SIB Colombia (Optimized)
============================================================
Two-phase approach to fetch species data from the SIB Colombia API:

  Phase 1 — Bulk fetch all species registered in Caldas department
            using GET /record_search/advanced_search?department=Caldas.
            Instantly matches species present in the SIB Caldas catalog.

  Phase 2 — For species NOT matched in Phase 1, fall back to individual
            simple search (GET /record_search/search?q=...) which searches
            the entire national catalog (not limited to Caldas distribution).

This is significantly faster than searching all 719 species individually
(~4 bulk requests + ~690 individual vs ~1438 individual calls).

Uso:
    python scripts/species/08_fetch_sib_bulk.py
    python scripts/species/08_fetch_sib_bulk.py --limit 50   # dry-run

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
CHECKPOINT_FILE = OUTPUT_DIR / "_checkpoint_bulk.json"

# ── API config ─────────────────────────────────────────────────────
API_BASE = "https://api.catalogo.biodiversidad.co"
SEARCH_URL = f"{API_BASE}/record_search/search"
ADVANCED_URL = f"{API_BASE}/record_search/advanced_search"
RECORD_URL = f"{API_BASE}/record"
REQUEST_DELAY = 0.3  # seconds between requests
REQUEST_TIMEOUT = 30  # seconds

# ── CSV columns matching SpeciesCsvRecord.cs + Slug ────────────────
CSV_COLUMNS = [
    "Kingdom", "Phylum", "Class", "Order", "Family", "Genus",
    "ScientificName", "CommonName", "Slug", "Description",
    "ConservationStatus", "TraditionalUses", "IsSensitive", "ThumbnailUrl",
]

# Conservation statuses that mark a species as sensitive
SENSITIVE_STATUSES = {"CR", "EN", "PELIGRO CRÍTICO", "EN PELIGRO"}


# ── Helper functions ───────────────────────────────────────────────

def generate_slug(scientific_name: str) -> str:
    """Generate URL-friendly slug from scientific name.

    Example: 'Vultur gryphus' -> 'vultur-gryphus'
    """
    text = unicodedata.normalize("NFKD", scientific_name)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def read_species_list(filepath: Path) -> list[str]:
    """Read species names from per_class_metrics.csv."""
    species_names: list[str] = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_name = row.get("species", "").strip()
            if raw_name:
                species_names.append(raw_name.replace("_", " "))
    print(f"[INFO] Read {len(species_names):,} species from {filepath.name}")
    return species_names


def is_sensitive(conservation_status: str) -> bool:
    """Determine if species is sensitive based on conservation status."""
    status_upper = conservation_status.upper()
    for keyword in SENSITIVE_STATUSES:
        if keyword in status_upper:
            return True
    return False


# ── API interaction ────────────────────────────────────────────────

def fetch_caldas_catalog() -> dict[str, dict]:
    """Phase 1: Bulk fetch all species in Caldas from SIB catalog.

    Splits by kingdom to bypass the 1000 records per request limit.
    Returns dict: { canonical_name_lower: search_record }
    """
    kingdoms = ["Animalia", "Plantae", "Fungi", "Bacteria", "Chromista", "Protozoa"]
    catalog: dict[str, dict] = {}

    for kingdom in kingdoms:
        print(f"  Fetching {kingdom}...", end=" ")
        try:
            resp = requests.get(
                ADVANCED_URL,
                params={"department": "Caldas", "kingdom": kingdom, "size": 1000},
                timeout=REQUEST_TIMEOUT,
            )
            if resp.status_code == 406:
                print("0 records")
                continue
            resp.raise_for_status()
            data = resp.json()
            if not isinstance(data, list):
                print("0 records")
                continue

            count = 0
            for rec in data:
                canonical = (
                    rec.get("taxonRecordNameApprovedInUse", {})
                    .get("taxonRecordName", {})
                    .get("scientificName", {})
                    .get("canonicalName", {})
                    .get("simple", "")
                )
                if canonical:
                    catalog[canonical.lower()] = rec
                    count += 1
            print(f"{count} records")

        except requests.RequestException as e:
            print(f"ERROR: {e}")

        time.sleep(REQUEST_DELAY)

    return catalog


def search_species_simple(scientific_name: str) -> Optional[dict]:
    """Search for a species via simple search (full national catalog).

    Returns the first matching record or None.
    The API returns HTTP 406 when no results are found.
    """
    try:
        resp = requests.get(
            SEARCH_URL,
            params={"q": scientific_name, "size": 1},
            timeout=REQUEST_TIMEOUT,
        )
        if resp.status_code == 406:
            return None
        resp.raise_for_status()
        results = resp.json()
        if isinstance(results, list) and len(results) > 0:
            result = results[0]
            # Validate name match
            canonical = (
                result.get("taxonRecordNameApprovedInUse", {})
                .get("taxonRecordName", {})
                .get("scientificName", {})
                .get("canonicalName", {})
                .get("simple", "")
            )
            if canonical.lower() == scientific_name.lower():
                return result
            # Partial match (subspecies)
            if scientific_name.lower() in canonical.lower():
                return result
            return None
    except requests.RequestException as e:
        print(f"  [WARN] Search error for '{scientific_name}': {e}")
    except (json.JSONDecodeError, KeyError):
        pass
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
    except json.JSONDecodeError:
        pass
    return None


# ── Data extraction ────────────────────────────────────────────────

def extract_taxonomy(record: dict) -> dict[str, str]:
    """Extract taxonomy hierarchy from a full record."""
    taxonomy = {
        "Kingdom": "", "Phylum": "", "Class": "",
        "Order": "", "Family": "", "Genus": "",
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
    for key in ("commonNamesAtomized", "commonNames"):
        names = record.get(key, [])
        if not names:
            continue
        # Prefer Spanish
        for cn in names:
            lang = (cn.get("language") or "").lower()
            name = cn.get("name", "").strip()
            if lang == "español" and name:
                return name
        # Fallback: any name
        for cn in names:
            name = cn.get("name", "").strip()
            if name:
                return name
    return ""


def extract_description(record: dict) -> str:
    """Extract species description, truncated to ~500 chars."""
    full_desc = record.get("fullDescription", {})
    text = ""
    if isinstance(full_desc, dict):
        text = full_desc.get("fullDescriptionUnstructured", "") or ""
    if not text:
        text = record.get("abstract", "") or ""
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
    threat_statuses = record.get("threatStatus", [])
    status_parts: list[str] = []
    for ts in threat_statuses:
        atomized = ts.get("threatStatusAtomized", {})
        category = atomized.get("threatCategory", {})
        value = category.get("measurementValue", "")
        mtype = category.get("measurementType", "")
        if value and mtype:
            status_parts.append(f"{value} ({mtype})")
        cites = atomized.get("apendiceCITES", [])
        if cites:
            status_parts.append(f"CITES {','.join(cites)}")
    if status_parts:
        return "; ".join(status_parts)
    # Fallback to threatStatusValue
    for src in (record, search_record):
        if src:
            tsv = src.get("threatStatusValue", "")
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
    ancillary = record.get("ancillaryData", [])
    for ad in ancillary:
        if isinstance(ad, dict):
            media_urls = ad.get("mediaURL", [])
            if media_urls and isinstance(media_urls, list) and media_urls[0]:
                return media_urls[0]
    for src in (record, search_record):
        if src:
            image_info = src.get("imageInfo", {})
            if isinstance(image_info, dict):
                main_img = image_info.get("mainImage", "")
                if main_img:
                    return main_img
    return ""


def build_csv_row(
    scientific_name: str,
    full_record: dict,
    search_record: Optional[dict] = None,
) -> dict[str, str]:
    """Build a CSV row from a full record and optional search record."""
    taxonomy = extract_taxonomy(full_record)
    common_name = extract_common_name(full_record)
    description = extract_description(full_record)
    conservation = extract_conservation_status(full_record, search_record)
    traditional_uses = extract_traditional_uses(full_record)
    thumbnail = extract_thumbnail(full_record, search_record)
    slug = generate_slug(scientific_name)
    sensitive = is_sensitive(conservation)

    return {
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


# ── Checkpoint ─────────────────────────────────────────────────────

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


# ── Output ─────────────────────────────────────────────────────────

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
    found_rows: list[dict],
    not_found: list[str],
    phase1_count: int,
    phase2_count: int,
) -> str:
    """Generate human-readable fetch report."""
    total = len(species_list)
    found_count = len(found_rows)
    not_found_count = len(not_found)
    found_pct = (found_count / max(total, 1)) * 100

    kingdom_counts = Counter(r.get("Kingdom", "Unknown") for r in found_rows)
    class_counts = Counter(r.get("Class", "Unknown") for r in found_rows)

    sensitive_count = sum(1 for r in found_rows if r.get("IsSensitive") == "True")
    with_thumb = sum(1 for r in found_rows if r.get("ThumbnailUrl", ""))
    with_desc = sum(1 for r in found_rows if r.get("Description", ""))
    with_name = sum(1 for r in found_rows if r.get("CommonName", ""))

    lines = [
        "=" * 60,
        "  SPECIES DATA FETCH REPORT - SIB Colombia API",
        "  Catálogo de la Biodiversidad de Colombia",
        "  (Optimized Bulk Fetch)",
        "=" * 60,
        "",
        f"Total species in dataset:     {total:,}",
        f"Found in SIB catalog:         {found_count:,} ({found_pct:.1f}%)",
        f"  ├─ Phase 1 (Caldas bulk):   {phase1_count:,}",
        f"  └─ Phase 2 (individual):    {phase2_count:,}",
        f"Not found:                    {not_found_count:,} "
        f"({100 - found_pct:.1f}%)",
        "",
        "─" * 40,
        "DATA COMPLETENESS (found species):",
        "─" * 40,
        f"  With common name:    {with_name:4d} / {found_count}",
        f"  With description:    {with_desc:4d} / {found_count}",
        f"  With thumbnail:      {with_thumb:4d} / {found_count}",
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


# ── Main ───────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bulk fetch species data from SIB Colombia API"
    )
    parser.add_argument(
        "--limit", type=int, default=0,
        help="Limit number of species to process (0 = all)",
    )
    parser.add_argument(
        "--no-checkpoint", action="store_true",
        help="Ignore checkpoint and start fresh",
    )
    args = parser.parse_args()

    if not METRICS_CSV.exists():
        print(f"[ERROR] Input file not found: {METRICS_CSV}")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── Step 1: Read species list ──────────────────────────────────
    print("\n[STEP 1/5] Reading species list...")
    species_list = read_species_list(METRICS_CSV)
    if args.limit > 0:
        species_list = species_list[:args.limit]
        print(f"[INFO] Limited to {args.limit} species (dry-run mode)")

    species_set = {s.lower(): s for s in species_list}  # lower -> original

    # ── Step 2: Load checkpoint ────────────────────────────────────
    print("\n[STEP 2/5] Loading checkpoint...")
    if args.no_checkpoint:
        checkpoint: dict[str, dict] = {}
        print("[INFO] Checkpoint ignored (fresh start)")
    else:
        checkpoint = load_checkpoint()

    # ── Step 3: Phase 1 — Bulk fetch Caldas department ─────────────
    print("\n[STEP 3/5] Phase 1: Bulk fetching Caldas department catalog...")
    caldas_catalog = fetch_caldas_catalog()
    print(f"[INFO] SIB Caldas catalog: {len(caldas_catalog):,} unique species")

    found_rows: list[dict] = []
    not_found: list[str] = []
    full_details: dict[str, Any] = {}
    phase1_count = 0
    phase2_count = 0

    # Match Phase 1
    phase1_matched: set[str] = set()
    phase1_unmatched: list[str] = []

    for species_lower, species_original in species_set.items():
        if species_lower in caldas_catalog:
            phase1_matched.add(species_lower)
        else:
            phase1_unmatched.append(species_original)

    print(f"[INFO] Phase 1 matched: {len(phase1_matched)} species")
    print(f"[INFO] Phase 1 unmatched (→ Phase 2): {len(phase1_unmatched)} species")

    # Process Phase 1 matches (fetch full record for each)
    print("\n  Processing Phase 1 matches...")
    for species_lower in sorted(phase1_matched):
        species_original = species_set[species_lower]
        search_record = caldas_catalog[species_lower]
        record_id = search_record.get("_id", "")

        # Check checkpoint
        if species_original in checkpoint:
            cached = checkpoint[species_original]
            if cached.get("found"):
                found_rows.append(cached["csv_row"])
                phase1_count += 1
                print(f"    {species_original} → cached ✓")
            continue

        if not record_id:
            continue

        print(f"    Fetching: {species_original}...", end=" ")
        full_record = fetch_full_record(record_id)
        if not full_record:
            full_record = search_record

        csv_row = build_csv_row(species_original, full_record, search_record)
        found_rows.append(csv_row)
        full_details[species_original] = full_record
        phase1_count += 1

        checkpoint[species_original] = {
            "found": True, "phase": 1, "csv_row": csv_row,
        }

        common = csv_row.get("CommonName", "")
        info = f"'{common}'" if common else "no common name"
        print(f"✓ P1 ({info})")

        time.sleep(REQUEST_DELAY)

    save_checkpoint(checkpoint)

    # ── Step 4: Phase 2 — Individual search for unmatched ──────────
    print(f"\n[STEP 4/5] Phase 2: Individual search for "
          f"{len(phase1_unmatched)} unmatched species...")

    total_p2 = len(phase1_unmatched)
    for i, species_name in enumerate(sorted(phase1_unmatched), 1):
        progress = f"[{i}/{total_p2}]"

        # Check checkpoint
        if species_name in checkpoint:
            cached = checkpoint[species_name]
            if cached.get("found"):
                found_rows.append(cached["csv_row"])
                phase2_count += 1
                print(f"  {progress} {species_name} → cached ✓")
            else:
                not_found.append(species_name)
                print(f"  {progress} {species_name} → cached ✗")
            continue

        print(f"  {progress} Searching: {species_name}...", end=" ")

        search_result = search_species_simple(species_name)

        if search_result:
            record_id = search_result.get("_id", "")
            if record_id:
                time.sleep(REQUEST_DELAY)
                full_record = fetch_full_record(record_id)
                if not full_record:
                    full_record = search_result
            else:
                full_record = search_result

            csv_row = build_csv_row(species_name, full_record, search_result)
            found_rows.append(csv_row)
            full_details[species_name] = full_record
            phase2_count += 1

            checkpoint[species_name] = {
                "found": True, "phase": 2, "csv_row": csv_row,
            }

            common = csv_row.get("CommonName", "")
            info = f"'{common}'" if common else "no common name"
            print(f"✓ P2 ({info})")
        else:
            not_found.append(species_name)
            checkpoint[species_name] = {"found": False}
            print("✗ (not found)")

        # Checkpoint every 50
        if i % 50 == 0:
            save_checkpoint(checkpoint)
            print(f"  [CHECKPOINT] Saved progress ({i}/{total_p2})")

        time.sleep(REQUEST_DELAY)

    # Final checkpoint save
    save_checkpoint(checkpoint)

    # ── Step 5: Save outputs ───────────────────────────────────────
    print(f"\n[STEP 5/5] Saving outputs to {OUTPUT_DIR}...")

    csv_path = OUTPUT_DIR / "species_import.csv"
    save_csv(found_rows, csv_path)

    json_path = OUTPUT_DIR / "species_full_detail.json"
    save_full_detail(full_details, json_path)

    report = generate_report(
        species_list, found_rows, not_found, phase1_count, phase2_count
    )
    report_path = OUTPUT_DIR / "fetch_report.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"[INFO] Report saved to {report_path}")

    print("\n" + report)
    print(f"\n✅ Bulk species fetch complete! Outputs in: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
