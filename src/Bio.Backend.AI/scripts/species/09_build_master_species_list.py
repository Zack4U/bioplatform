from __future__ import annotations

"""
Script 09: Build Master Species List
======================================
Merges species from the CNN dataset (per_class_metrics.csv) with species
registered in the SIB Colombia catalog for Caldas (department=CO-CAL).

The result is a deduplicated master list of 1000+ species ready for the
LLM data generation pipeline (script 10).

Uso:
    python scripts/species/09_build_master_species_list.py

Salida:
    - data/species_catalog/master_species_list.csv
    - data/species_catalog/master_species_list.json
    - data/species_catalog/master_list_report.txt
"""

import csv
import json
import sys
import time
from collections import Counter
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("[ERROR] 'requests' is required. Install: pip install requests")
    sys.exit(1)

# ── Paths ──────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
METRICS_CSV = PROJECT_ROOT / "data" / "evaluation" / "per_class_metrics.csv"
OUTPUT_DIR = PROJECT_ROOT / "data" / "species_catalog"

# ── API config ─────────────────────────────────────────────────────
API_BASE = "https://api.catalogo.biodiversidad.co"
ADVANCED_URL = f"{API_BASE}/record_search/advanced_search"
DEPARTMENT = "CO-CAL"
REQUEST_TIMEOUT = 30


def read_dataset_species(filepath: Path) -> list[dict[str, str]]:
    """Read species from CNN dataset per_class_metrics.csv."""
    species: list[dict[str, str]] = []
    seen: set[str] = set()
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw = row.get("species", "").strip()
            if not raw:
                continue
            name = raw.replace("_", " ")
            key = name.lower()
            if key not in seen:
                seen.add(key)
                species.append({
                    "scientific_name": name,
                    "source": "dataset",
                })
    return species


def fetch_sib_caldas_species() -> list[dict[str, Any]]:
    """Fetch all species from SIB Colombia for Caldas (CO-CAL).

    Since CO-CAL returns ~688 records (under the 1000 API limit),
    a single request is sufficient.
    """
    print(f"  Fetching SIB CO-CAL (department={DEPARTMENT})...")
    try:
        resp = requests.get(
            ADVANCED_URL,
            params={"department": DEPARTMENT, "size": 1000},
            timeout=REQUEST_TIMEOUT,
        )
        if resp.status_code == 406:
            print("  [WARN] No results from SIB for CO-CAL")
            return []
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, list):
            return []

        species: list[dict[str, Any]] = []
        for rec in data:
            canonical = (
                rec.get("taxonRecordNameApprovedInUse", {})
                .get("taxonRecordName", {})
                .get("scientificName", {})
                .get("canonicalName", {})
                .get("simple", "")
            )
            if not canonical:
                continue

            # Extract basic info from search result
            record_id = rec.get("_id", "")
            threat = rec.get("threatStatusValue", "") or ""
            image_info = rec.get("imageInfo", {}) or {}
            main_image = ""
            if isinstance(image_info, dict):
                main_image = image_info.get("mainImage", "") or ""

            species.append({
                "scientific_name": canonical,
                "source": "sib_caldas",
                "sib_id": record_id,
                "threat_status": threat,
                "thumbnail_url": main_image,
            })
        return species

    except requests.RequestException as e:
        print(f"  [ERROR] SIB fetch failed: {e}")
        return []


def merge_species(
    dataset: list[dict[str, str]],
    sib: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Merge and deduplicate species from both sources.

    Dataset species take priority. SIB-only species are added.
    Overlapping species get both sources tagged.
    """
    merged: dict[str, dict[str, Any]] = {}

    # Add dataset species first (priority)
    for sp in dataset:
        key = sp["scientific_name"].lower()
        merged[key] = {
            "scientific_name": sp["scientific_name"],
            "sources": ["dataset"],
            "sib_id": "",
            "threat_status": "",
            "thumbnail_url": "",
            "in_cnn_dataset": True,
        }

    # Add/merge SIB species
    for sp in sib:
        key = sp["scientific_name"].lower()
        if key in merged:
            # Already from dataset — add SIB source and metadata
            merged[key]["sources"].append("sib_caldas")
            merged[key]["sib_id"] = sp.get("sib_id", "")
            merged[key]["threat_status"] = sp.get("threat_status", "")
            if not merged[key]["thumbnail_url"]:
                merged[key]["thumbnail_url"] = sp.get("thumbnail_url", "")
        else:
            # New species from SIB only
            merged[key] = {
                "scientific_name": sp["scientific_name"],
                "sources": ["sib_caldas"],
                "sib_id": sp.get("sib_id", ""),
                "threat_status": sp.get("threat_status", ""),
                "thumbnail_url": sp.get("thumbnail_url", ""),
                "in_cnn_dataset": False,
            }

    # Sort by name
    result = sorted(merged.values(), key=lambda x: x["scientific_name"].lower())
    return result


def save_csv(species: list[dict[str, Any]], output_path: Path) -> None:
    """Save master list as CSV (simple format for LLM processing)."""
    columns = [
        "scientific_name", "sources", "in_cnn_dataset",
        "sib_id", "threat_status", "thumbnail_url",
    ]
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        for sp in species:
            row = {**sp, "sources": "|".join(sp["sources"])}
            writer.writerow(row)
    print(f"[INFO] CSV saved: {output_path} ({len(species)} rows)")


def save_json(species: list[dict[str, Any]], output_path: Path) -> None:
    """Save master list as JSON (detailed format)."""
    data = {
        "total": len(species),
        "sources": {
            "dataset": "per_class_metrics.csv (CNN training species)",
            "sib_caldas": f"SIB Colombia advanced_search (department={DEPARTMENT})",
        },
        "species": species,
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[INFO] JSON saved: {output_path}")


def generate_report(
    dataset: list[dict[str, str]],
    sib: list[dict[str, Any]],
    merged: list[dict[str, Any]],
) -> str:
    """Generate human-readable merge report."""
    dataset_count = len(dataset)
    sib_count = len(sib)
    total = len(merged)
    overlap = sum(1 for sp in merged if len(sp["sources"]) > 1)
    only_dataset = sum(1 for sp in merged if sp["sources"] == ["dataset"])
    only_sib = sum(1 for sp in merged if sp["sources"] == ["sib_caldas"])
    in_cnn = sum(1 for sp in merged if sp["in_cnn_dataset"])
    with_sib_id = sum(1 for sp in merged if sp.get("sib_id"))
    with_thumbnail = sum(1 for sp in merged if sp.get("thumbnail_url"))

    lines = [
        "=" * 60,
        "  MASTER SPECIES LIST — BUILD REPORT",
        "  BioPlatform Caldas",
        "=" * 60,
        "",
        "── SOURCES ─────────────────────────────",
        f"  CNN Dataset species:        {dataset_count:,}",
        f"  SIB Caldas (CO-CAL):        {sib_count:,}",
        "",
        "── MERGE RESULTS ───────────────────────",
        f"  Total merged (unique):      {total:,}",
        f"  ├─ Only in dataset:         {only_dataset:,}",
        f"  ├─ Only in SIB Caldas:      {only_sib:,}",
        f"  └─ In both sources:         {overlap:,}",
        "",
        f"  Meets 1000+ threshold:      {'✅ YES' if total >= 1000 else '⚠️  NO (' + str(1000 - total) + ' short)'}",
        "",
        "── DATA AVAILABLE ──────────────────────",
        f"  In CNN dataset (images):    {in_cnn:,}",
        f"  With SIB record ID:         {with_sib_id:,}",
        f"  With thumbnail URL:         {with_thumbnail:,}",
        "",
    ]

    # Show overlap species
    if overlap > 0:
        lines += [
            "── SPECIES IN BOTH SOURCES ─────────────",
            f"  (showing first 20 of {overlap})",
        ]
        both = [sp for sp in merged if len(sp["sources"]) > 1]
        for sp in both[:20]:
            lines.append(f"    • {sp['scientific_name']}")
        if overlap > 20:
            lines.append(f"    ... and {overlap - 20} more")

    lines.append("")
    return "\n".join(lines)


def main() -> None:
    if not METRICS_CSV.exists():
        print(f"[ERROR] Dataset file not found: {METRICS_CSV}")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: Read sources
    print("\n[STEP 1/3] Reading species sources...")
    dataset_species = read_dataset_species(METRICS_CSV)
    print(f"  CNN dataset: {len(dataset_species):,} unique species")

    sib_species = fetch_sib_caldas_species()
    print(f"  SIB Caldas (CO-CAL): {len(sib_species):,} species")

    # Step 2: Merge
    print("\n[STEP 2/3] Merging and deduplicating...")
    master = merge_species(dataset_species, sib_species)
    print(f"  Master list: {len(master):,} unique species")

    # Step 3: Save outputs
    print("\n[STEP 3/3] Saving outputs...")
    csv_path = OUTPUT_DIR / "master_species_list.csv"
    save_csv(master, csv_path)

    json_path = OUTPUT_DIR / "master_species_list.json"
    save_json(master, json_path)

    report = generate_report(dataset_species, sib_species, master)
    report_path = OUTPUT_DIR / "master_list_report.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"[INFO] Report saved: {report_path}")

    print("\n" + report)
    print(f"✅ Master species list built! {len(master):,} species in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
