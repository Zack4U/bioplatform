from __future__ import annotations

"""
Script 11: Analyze Species Economic Potential & Traditional Uses
================================================================
Reads the JSON outputs from script 10 (LLM generation) and produces
a consolidated analysis with statistics, rankings, and percentages.

Uso:
    python scripts/species/11_analyze_uses_potential.py

Salida:
    - data/species_catalog/analysis_report.txt   (detailed text report)
    - data/species_catalog/analysis_summary.json  (machine-readable summary)
"""

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

# ── Paths ──────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "species_catalog"

USES_FILE = DATA_DIR / "species_traditional_uses.json"
POTENTIAL_FILE = DATA_DIR / "species_economic_potential.json"
CSV_FILE = DATA_DIR / "species_import_llm.csv"
MASTER_FILE = DATA_DIR / "master_species_list.json"

REPORT_FILE = DATA_DIR / "analysis_report.txt"
SUMMARY_FILE = DATA_DIR / "analysis_summary.json"


def load_json(path: Path) -> list[dict]:
    """Load JSON file, return empty list if missing."""
    if not path.exists():
        print(f"[WARN] File not found: {path}")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_csv_kingdoms(path: Path) -> dict[str, str]:
    """Load species kingdom mapping from CSV."""
    import csv
    kingdoms: dict[str, str] = {}
    if not path.exists():
        return kingdoms
    with open(path, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            name = row.get("ScientificName", "")
            kingdom = row.get("Kingdom", "")
            if name and kingdom:
                kingdoms[name.lower()] = kingdom
    return kingdoms


def analyze_economic_potential(
    data: list[dict],
    kingdoms: dict[str, str],
) -> dict[str, Any]:
    """Analyze economic potential data."""
    total_species = len(data)
    if total_species == 0:
        return {"total_species": 0}

    # Counters
    sector_counts: Counter = Counter()
    market_value_counts: Counter = Counter()
    sustainability_counts: Counter = Counter()
    confidence_counts: Counter = Counter()
    product_counts: Counter = Counter()
    sector_by_kingdom: dict[str, Counter] = defaultdict(Counter)
    sector_market_value: dict[str, Counter] = defaultdict(Counter)
    multi_sector: int = 0
    total_entries = 0

    species_per_sector: dict[str, list[str]] = defaultdict(list)

    for sp in data:
        name = sp.get("scientific_name", "")
        entries = sp.get("economic_potential", [])
        confidence_counts[sp.get("confidence", "?")] += 1
        kingdom = kingdoms.get(name.lower(), "Desconocido")

        if len(entries) > 1:
            multi_sector += 1

        for entry in entries:
            total_entries += 1
            sector = entry.get("sector", "Desconocido")
            market = entry.get("market_value", "Desconocido")
            sustain = entry.get("sustainability_level", "Desconocido")

            sector_counts[sector] += 1
            market_value_counts[market] += 1
            sustainability_counts[sustain] += 1
            sector_by_kingdom[sector][kingdom] += 1
            sector_market_value[sector][market] += 1
            species_per_sector[sector].append(name)

            for prod in entry.get("products", []):
                product_counts[prod] += 1

    return {
        "total_species": total_species,
        "total_entries": total_entries,
        "multi_sector_species": multi_sector,
        "sectors": dict(sector_counts.most_common()),
        "market_values": dict(market_value_counts.most_common()),
        "sustainability": dict(sustainability_counts.most_common()),
        "confidence": dict(confidence_counts.most_common()),
        "top_products": dict(product_counts.most_common(20)),
        "sector_by_kingdom": {
            s: dict(kc.most_common()) for s, kc in sector_by_kingdom.items()
        },
        "sector_market_value": {
            s: dict(mvc.most_common()) for s, mvc in sector_market_value.items()
        },
        "species_per_sector": {
            s: names for s, names in species_per_sector.items()
        },
    }


def analyze_traditional_uses(
    data: list[dict],
    kingdoms: dict[str, str],
) -> dict[str, Any]:
    """Analyze traditional uses data."""
    total_species = len(data)
    if total_species == 0:
        return {"total_species": 0}

    part_counts: Counter = Counter()
    use_counts: Counter = Counter()
    community_counts: Counter = Counter()
    confidence_counts: Counter = Counter()
    part_by_kingdom: dict[str, Counter] = defaultdict(Counter)
    multi_use: int = 0
    total_entries = 0

    species_per_use: dict[str, list[str]] = defaultdict(list)

    for sp in data:
        name = sp.get("scientific_name", "")
        entries = sp.get("traditional_uses", [])
        confidence_counts[sp.get("confidence", "?")] += 1
        kingdom = kingdoms.get(name.lower(), "Desconocido")

        if len(entries) > 1:
            multi_use += 1

        for entry in entries:
            total_entries += 1
            part = entry.get("part", "Desconocido")
            community = entry.get("community", "Desconocido")

            part_counts[part] += 1
            community_counts[community] += 1
            part_by_kingdom[part][kingdom] += 1

            for use in entry.get("uses", []):
                use_counts[use] += 1
                species_per_use[use].append(name)

    return {
        "total_species": total_species,
        "total_entries": total_entries,
        "multi_use_species": multi_use,
        "parts": dict(part_counts.most_common()),
        "uses": dict(use_counts.most_common()),
        "communities": dict(community_counts.most_common(15)),
        "confidence": dict(confidence_counts.most_common()),
        "part_by_kingdom": {
            p: dict(kc.most_common()) for p, kc in part_by_kingdom.items()
        },
        "species_per_use": {
            u: names for u, names in species_per_use.items()
        },
    }


def format_bar(value: int, total: int, width: int = 25) -> str:
    """Create a simple text bar chart."""
    pct = (value / max(total, 1)) * 100
    filled = int((value / max(total, 1)) * width)
    bar = "█" * filled + "░" * (width - filled)
    return f"{bar} {value:4d} ({pct:5.1f}%)"


def generate_report(
    econ: dict[str, Any],
    uses: dict[str, Any],
    master_total: int,
) -> str:
    """Generate the full text report."""
    lines: list[str] = []

    def section(title: str) -> None:
        lines.append("")
        lines.append("━" * 60)
        lines.append(f"  {title}")
        lines.append("━" * 60)

    def subsection(title: str) -> None:
        lines.append("")
        lines.append(f"  ── {title} {'─' * (50 - len(title))}")

    # ── Header ─────────────────────────────────────────────────
    lines.append("╔" + "═" * 58 + "╗")
    lines.append("║" + "  BIOPLATFORM CALDAS — SPECIES DATA ANALYSIS".center(58) + "║")
    lines.append("║" + "  Potencial Económico & Usos Tradicionales".center(58) + "║")
    lines.append("╚" + "═" * 58 + "╝")
    lines.append("")
    lines.append(f"  Total species in master list:         {master_total:,}")
    lines.append(f"  With economic potential:               {econ['total_species']:,}"
                 f" ({econ['total_species'] / max(master_total, 1) * 100:.1f}%)")
    lines.append(f"  With traditional uses:                 {uses['total_species']:,}"
                 f" ({uses['total_species'] / max(master_total, 1) * 100:.1f}%)")

    # ════════════════════════════════════════════════════════════
    # ECONOMIC POTENTIAL
    # ════════════════════════════════════════════════════════════
    section("POTENCIAL ECONÓMICO")

    lines.append(f"  Total entries:                       {econ.get('total_entries', 0):,}")
    lines.append(f"  Multi-sector species:                {econ.get('multi_sector_species', 0):,}")

    subsection("Por Sector")
    total_entries = econ.get("total_entries", 1)
    for sector, count in econ.get("sectors", {}).items():
        lines.append(f"    {sector:22s} {format_bar(count, total_entries)}")

    subsection("Valor de Mercado (Market Value)")
    for mv, count in econ.get("market_values", {}).items():
        lines.append(f"    {mv:22s} {format_bar(count, total_entries)}")

    subsection("Nivel de Sostenibilidad")
    for sl, count in econ.get("sustainability", {}).items():
        lines.append(f"    {sl:22s} {format_bar(count, total_entries)}")

    subsection("Top 20 Productos/Servicios")
    for i, (prod, count) in enumerate(econ.get("top_products", {}).items(), 1):
        lines.append(f"    {i:2d}. {prod:40s} → {count:4d} especies")

    subsection("Sectores por Reino (Kingdom)")
    for sector, kingdoms in econ.get("sector_by_kingdom", {}).items():
        kingdom_str = ", ".join(f"{k}: {v}" for k, v in kingdoms.items())
        lines.append(f"    {sector:22s} → {kingdom_str}")

    subsection("Valor de Mercado por Sector")
    for sector, mvs in econ.get("sector_market_value", {}).items():
        mv_str = ", ".join(f"{k}: {v}" for k, v in mvs.items())
        lines.append(f"    {sector:22s} → {mv_str}")

    subsection("Confianza de los Datos")
    for conf, count in econ.get("confidence", {}).items():
        lines.append(f"    {conf:22s} {format_bar(count, econ['total_species'])}")

    # ════════════════════════════════════════════════════════════
    # TRADITIONAL USES
    # ════════════════════════════════════════════════════════════
    section("USOS TRADICIONALES")

    lines.append(f"  Total entries:                       {uses.get('total_entries', 0):,}")
    lines.append(f"  Multi-use species:                   {uses.get('multi_use_species', 0):,}")

    subsection("Por Parte Utilizada")
    total_uses_entries = uses.get("total_entries", 1)
    for part, count in uses.get("parts", {}).items():
        lines.append(f"    {part:22s} {format_bar(count, total_uses_entries)}")

    subsection("Por Tipo de Uso")
    for use, count in uses.get("uses", {}).items():
        lines.append(f"    {use:30s} {format_bar(count, total_uses_entries)}")

    subsection("Top 15 Comunidades")
    for comm, count in uses.get("communities", {}).items():
        lines.append(f"    {comm:45s} → {count:3d}")

    subsection("Partes por Reino (Kingdom)")
    for part, kingdoms in uses.get("part_by_kingdom", {}).items():
        kingdom_str = ", ".join(f"{k}: {v}" for k, v in kingdoms.items())
        lines.append(f"    {part:22s} → {kingdom_str}")

    subsection("Confianza de los Datos")
    for conf, count in uses.get("confidence", {}).items():
        lines.append(f"    {conf:22s} {format_bar(count, uses['total_species'])}")

    # ════════════════════════════════════════════════════════════
    # CROSS-ANALYSIS
    # ════════════════════════════════════════════════════════════
    section("ANÁLISIS CRUZADO")

    # Species with BOTH uses and potential
    uses_names = {sp["scientific_name"] for sp in load_json(USES_FILE)}
    potential_names = {sp["scientific_name"] for sp in load_json(POTENTIAL_FILE)}
    both = uses_names & potential_names
    only_uses = uses_names - potential_names
    only_potential = potential_names - uses_names

    lines.append(f"  With both uses + potential:           {len(both):,}")
    lines.append(f"  Only traditional uses:                {len(only_uses):,}")
    lines.append(f"  Only economic potential:               {len(only_potential):,}")
    lines.append(f"  Neither:                              "
                 f"{master_total - len(uses_names | potential_names):,}")

    if both:
        subsection("Especies con Usos + Potencial (primeras 20)")
        for name in sorted(both)[:20]:
            lines.append(f"    • {name}")
        if len(both) > 20:
            lines.append(f"    ... y {len(both) - 20} más")

    lines.append("")
    return "\n".join(lines)


def main() -> None:
    print("\n[STEP 1/3] Loading data...")

    uses_data = load_json(USES_FILE)
    potential_data = load_json(POTENTIAL_FILE)

    # Load master list for total count
    master_data = load_json(MASTER_FILE)
    master_total = master_data.get("total", 0) if isinstance(master_data, dict) else len(master_data)

    # Load kingdom mapping
    kingdoms = load_csv_kingdoms(CSV_FILE)

    print(f"  Economic potential entries: {len(potential_data):,}")
    print(f"  Traditional uses entries:   {len(uses_data):,}")
    print(f"  Master list total:          {master_total:,}")

    # Analysis
    print("\n[STEP 2/3] Analyzing data...")
    econ = analyze_economic_potential(potential_data, kingdoms)
    uses = analyze_traditional_uses(uses_data, kingdoms)

    # Generate outputs
    print("\n[STEP 3/3] Generating outputs...")

    report = generate_report(econ, uses, master_total)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"[INFO] Report saved: {REPORT_FILE}")

    summary = {
        "master_total": master_total,
        "economic_potential": econ,
        "traditional_uses": uses,
    }
    # Remove species lists from JSON summary (too large)
    for key in ["species_per_sector", "species_per_use"]:
        if key in summary.get("economic_potential", {}):
            summary["economic_potential"][key] = {
                s: len(n) for s, n in summary["economic_potential"][key].items()
            }
        if key in summary.get("traditional_uses", {}):
            summary["traditional_uses"][key] = {
                s: len(n) for s, n in summary["traditional_uses"][key].items()
            }

    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"[INFO] Summary saved: {SUMMARY_FILE}")

    print("\n" + report)
    print(f"\n✅ Analysis complete! Files in: {DATA_DIR}")


if __name__ == "__main__":
    main()
