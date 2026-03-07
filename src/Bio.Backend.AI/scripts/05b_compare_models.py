"""
Script 06: Comparación de Evaluaciones entre Versiones del CNN
================================================================
Compara los resultados de evaluación de dos versiones del modelo CNN,
generando un reporte general y un análisis detallado por especie.

Requisitos:
    Cada carpeta de versión debe contener:
      - evaluation_metrics.json   (métricas globales + per_class)
      - per_class_metrics.csv     (precision, recall, f1, support por especie)
      - misclassified_samples.json (muestras mal clasificadas)

Uso:
    python scripts/06_compare_models.py [--v1 data/comparation/v1] [--v2 data/comparation/v2]
                                        [--output data/comparation/report]

Salida:
    <output>/
    ├── comparison_report.txt       (reporte general legible)
    ├── comparison_per_species.csv  (detalle por especie con deltas)
    └── comparison_summary.json     (resumen máquina-legible)
"""

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any

# ── Resolve paths ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DEFAULT_V1 = PROJECT_ROOT / "data" / "comparation" / "v2"
DEFAULT_V2 = PROJECT_ROOT / "data" / "comparation" / "v3"
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "comparation" / "report"

# ── Helpers ────────────────────────────────────────────────────────

def _load_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _load_csv_metrics(path: Path) -> dict[str, dict[str, float]]:
    """Load per_class_metrics.csv into {species: {precision, recall, f1_score, support}}."""
    data: dict[str, dict[str, float]] = {}
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            species = row["species"]
            data[species] = {
                "precision": float(row["precision"]),
                "recall": float(row["recall"]),
                "f1_score": float(row["f1_score"]),
                "support": int(row["support"]),
            }
    return data


def _load_misclassified(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _fmt(val: float, decimals: int = 4) -> str:
    return f"{val:.{decimals}f}"


def _fmt_pct(val: float) -> str:
    return f"{val * 100:.2f}%"


def _delta_str(delta: float, decimals: int = 4) -> str:
    """Format delta with sign and color hint."""
    sign = "+" if delta > 0 else ""
    return f"{sign}{delta:.{decimals}f}"


def _delta_pct_str(delta: float) -> str:
    sign = "+" if delta > 0 else ""
    return f"{sign}{delta * 100:.2f}pp"


def _winner_label(delta: float) -> str:
    """v2 improvement = positive delta."""
    if abs(delta) < 0.001:
        return "="
    return "v2 ✓" if delta > 0 else "v1 ✓"


# ── Core comparison logic ─────────────────────────────────────────

def compare_global_metrics(m1: dict, m2: dict) -> dict[str, Any]:
    """Compare top-level accuracy/avg metrics."""
    results: dict[str, Any] = {}

    for key in ("accuracy", "top_5_accuracy"):
        v1_val = m1.get(key, 0.0)
        v2_val = m2.get(key, 0.0)
        delta = v2_val - v1_val
        results[key] = {
            "v1": v1_val, "v2": v2_val,
            "delta": round(delta, 6),
            "winner": _winner_label(delta),
        }

    for avg_key in ("macro_avg", "weighted_avg"):
        avg1 = m1.get(avg_key, {})
        avg2 = m2.get(avg_key, {})
        sub: dict[str, Any] = {}
        for metric in ("precision", "recall", "f1_score"):
            v1_val = avg1.get(metric, 0.0)
            v2_val = avg2.get(metric, 0.0)
            delta = v2_val - v1_val
            sub[metric] = {
                "v1": v1_val, "v2": v2_val,
                "delta": round(delta, 6),
                "winner": _winner_label(delta),
            }
        results[avg_key] = sub

    return results


def compare_per_species(
    csv1: dict[str, dict[str, float]],
    csv2: dict[str, dict[str, float]],
) -> list[dict[str, Any]]:
    """Compare per-species metrics between v1 and v2."""
    all_species = sorted(set(csv1.keys()) | set(csv2.keys()))
    rows: list[dict[str, Any]] = []

    for sp in all_species:
        d1 = csv1.get(sp, {})
        d2 = csv2.get(sp, {})

        row: dict[str, Any] = {"species": sp}
        in_v1 = sp in csv1
        in_v2 = sp in csv2

        if in_v1 and not in_v2:
            row["status"] = "removed_in_v2"
        elif not in_v1 and in_v2:
            row["status"] = "new_in_v2"
        else:
            row["status"] = "both"

        for metric in ("precision", "recall", "f1_score"):
            v1_val = d1.get(metric, 0.0)
            v2_val = d2.get(metric, 0.0)
            delta = v2_val - v1_val
            row[f"{metric}_v1"] = v1_val
            row[f"{metric}_v2"] = v2_val
            row[f"{metric}_delta"] = round(delta, 6)

        row["support_v1"] = int(d1.get("support", 0))
        row["support_v2"] = int(d2.get("support", 0))
        rows.append(row)

    return rows


def compare_misclassified(mis1: list[dict], mis2: list[dict]) -> dict[str, Any]:
    """Compare misclassification counts."""
    count1 = len(mis1)
    count2 = len(mis2)

    species_errors_v1: dict[str, int] = {}
    for s in mis1:
        sp = s.get("true_label", "unknown")
        species_errors_v1[sp] = species_errors_v1.get(sp, 0) + 1

    species_errors_v2: dict[str, int] = {}
    for s in mis2:
        sp = s.get("true_label", "unknown")
        species_errors_v2[sp] = species_errors_v2.get(sp, 0) + 1

    return {
        "total_v1": count1,
        "total_v2": count2,
        "delta": count2 - count1,
        "species_errors_v1": species_errors_v1,
        "species_errors_v2": species_errors_v2,
    }


# ── F1 tier analysis ─────────────────────────────────────────────

def _f1_tier(f1: float) -> str:
    if f1 >= 0.9:
        return ">=0.90"
    if f1 >= 0.7:
        return "0.70-0.89"
    if f1 >= 0.5:
        return "0.50-0.69"
    return "<0.50"


def compute_tier_migration(per_species: list[dict]) -> dict[str, Any]:
    """Track species movement between F1 tiers."""
    tiers_v1: dict[str, int] = {">=0.90": 0, "0.70-0.89": 0, "0.50-0.69": 0, "<0.50": 0}
    tiers_v2: dict[str, int] = {">=0.90": 0, "0.70-0.89": 0, "0.50-0.69": 0, "<0.50": 0}
    migrations: list[dict] = []

    for row in per_species:
        if row["status"] != "both":
            continue
        f1_v1 = row["f1_score_v1"]
        f1_v2 = row["f1_score_v2"]
        tier1 = _f1_tier(f1_v1)
        tier2 = _f1_tier(f1_v2)
        tiers_v1[tier1] += 1
        tiers_v2[tier2] += 1

        if tier1 != tier2:
            migrations.append({
                "species": row["species"],
                "f1_v1": f1_v1, "f1_v2": f1_v2,
                "tier_v1": tier1, "tier_v2": tier2,
                "direction": "improved" if f1_v2 > f1_v1 else "degraded",
            })

    return {"tiers_v1": tiers_v1, "tiers_v2": tiers_v2, "migrations": migrations}


# ── Report writers ────────────────────────────────────────────────

def write_text_report(
    output_path: Path,
    global_cmp: dict,
    per_species: list[dict],
    misclass_cmp: dict,
    tier_info: dict,
) -> None:
    """Generate the human-readable comparison report."""
    lines: list[str] = []
    W = 100
    SEP = "═" * W

    lines.append(SEP)
    lines.append("  REPORTE DE COMPARACIÓN DE MODELOS CNN  —  v1 vs v2".center(W))
    lines.append(SEP)
    lines.append("")

    # ── 1. Global metrics ──
    lines.append("1. MÉTRICAS GLOBALES")
    lines.append("─" * W)
    lines.append(f"  {'Métrica':<35} {'v1':>10} {'v2':>10} {'Delta':>12} {'Mejor':>10}")
    lines.append(f"  {'─' * 35} {'─' * 10} {'─' * 10} {'─' * 12} {'─' * 10}")

    for key in ("accuracy", "top_5_accuracy"):
        entry = global_cmp[key]
        lines.append(
            f"  {key:<35} {_fmt_pct(entry['v1']):>10} {_fmt_pct(entry['v2']):>10} "
            f"{_delta_pct_str(entry['delta']):>12} {entry['winner']:>10}"
        )

    for avg_key in ("macro_avg", "weighted_avg"):
        for metric, entry in global_cmp[avg_key].items():
            label = f"{avg_key}.{metric}"
            lines.append(
                f"  {label:<35} {_fmt_pct(entry['v1']):>10} {_fmt_pct(entry['v2']):>10} "
                f"{_delta_pct_str(entry['delta']):>12} {entry['winner']:>10}"
            )
    lines.append("")

    # ── 2. Misclassified summary ──
    lines.append("2. MUESTRAS MAL CLASIFICADAS")
    lines.append("─" * W)
    mc = misclass_cmp
    delta_mc = mc["delta"]
    mc_sign = "+" if delta_mc > 0 else ""
    mc_winner = "v2 ✓" if delta_mc < 0 else ("v1 ✓" if delta_mc > 0 else "=")
    lines.append(f"  Total v1: {mc['total_v1']}   |   Total v2: {mc['total_v2']}   |   "
                 f"Delta: {mc_sign}{delta_mc}   |   Mejor: {mc_winner}")

    # Top species with most error change
    all_err_species = sorted(
        set(mc["species_errors_v1"].keys()) | set(mc["species_errors_v2"].keys())
    )
    err_deltas = []
    for sp in all_err_species:
        e1 = mc["species_errors_v1"].get(sp, 0)
        e2 = mc["species_errors_v2"].get(sp, 0)
        err_deltas.append((sp, e1, e2, e2 - e1))

    # Show top 10 most improved and top 10 most degraded
    err_deltas.sort(key=lambda x: x[3])
    improved_errors = [e for e in err_deltas if e[3] < 0][:10]
    degraded_errors = [e for e in err_deltas if e[3] > 0][-10:][::-1]

    if improved_errors:
        lines.append("")
        lines.append("  Top especies con MENOS errores en v2:")
        lines.append(f"    {'Especie':<45} {'Err v1':>8} {'Err v2':>8} {'Delta':>8}")
        for sp, e1, e2, d in improved_errors:
            lines.append(f"    {sp:<45} {e1:>8} {e2:>8} {d:>8}")

    if degraded_errors:
        lines.append("")
        lines.append("  Top especies con MÁS errores en v2:")
        lines.append(f"    {'Especie':<45} {'Err v1':>8} {'Err v2':>8} {'Delta':>8}")
        for sp, e1, e2, d in degraded_errors:
            lines.append(f"    {sp:<45} {e1:>8} {e2:>8} {'+' + str(d):>8}")
    lines.append("")

    # ── 3. F1 Tier distribution ──
    lines.append("3. DISTRIBUCIÓN POR TIERS DE F1-SCORE")
    lines.append("─" * W)
    lines.append(f"  {'Tier':<20} {'v1':>8} {'v2':>8} {'Delta':>8}")
    lines.append(f"  {'─' * 20} {'─' * 8} {'─' * 8} {'─' * 8}")
    for tier in (">=0.90", "0.70-0.89", "0.50-0.69", "<0.50"):
        t1 = tier_info["tiers_v1"][tier]
        t2 = tier_info["tiers_v2"][tier]
        d = t2 - t1
        sign = "+" if d > 0 else ""
        lines.append(f"  {tier:<20} {t1:>8} {t2:>8} {sign + str(d):>8}")
    lines.append("")

    # Tier migrations
    migrations = tier_info["migrations"]
    if migrations:
        improved_mig = [m for m in migrations if m["direction"] == "improved"]
        degraded_mig = [m for m in migrations if m["direction"] == "degraded"]

        if improved_mig:
            lines.append(f"  Especies que SUBIERON de tier ({len(improved_mig)}):")
            lines.append(f"    {'Especie':<45} {'F1 v1':>8} {'F1 v2':>8} {'Tier v1':<12} → {'Tier v2':<12}")
            for m in sorted(improved_mig, key=lambda x: x["species"]):
                lines.append(
                    f"    {m['species']:<45} {_fmt(m['f1_v1']):<8} {_fmt(m['f1_v2']):<8} "
                    f"{m['tier_v1']:<12} → {m['tier_v2']:<12}"
                )
            lines.append("")

        if degraded_mig:
            lines.append(f"  Especies que BAJARON de tier ({len(degraded_mig)}):")
            lines.append(f"    {'Especie':<45} {'F1 v1':>8} {'F1 v2':>8} {'Tier v1':<12} → {'Tier v2':<12}")
            for m in sorted(degraded_mig, key=lambda x: x["species"]):
                lines.append(
                    f"    {m['species']:<45} {_fmt(m['f1_v1']):<8} {_fmt(m['f1_v2']):<8} "
                    f"{m['tier_v1']:<12} → {m['tier_v2']:<12}"
                )
            lines.append("")

    # ── 4. Per-species summary stats ──
    both = [r for r in per_species if r["status"] == "both"]
    improved = [r for r in both if r["f1_score_delta"] > 0.001]
    degraded = [r for r in both if r["f1_score_delta"] < -0.001]
    unchanged = [r for r in both if abs(r["f1_score_delta"]) <= 0.001]
    new_sp = [r for r in per_species if r["status"] == "new_in_v2"]
    removed_sp = [r for r in per_species if r["status"] == "removed_in_v2"]

    lines.append("4. RESUMEN POR ESPECIE")
    lines.append("─" * W)
    lines.append(f"  Total especies comparadas: {len(both)}")
    lines.append(f"  Mejoraron (F1 ↑):  {len(improved)}")
    lines.append(f"  Empeoraron (F1 ↓): {len(degraded)}")
    lines.append(f"  Sin cambio:        {len(unchanged)}")
    if new_sp:
        lines.append(f"  Nuevas en v2:      {len(new_sp)}")
    if removed_sp:
        lines.append(f"  Eliminadas en v2:  {len(removed_sp)}")
    lines.append("")

    # ── 5. Top improvements and degradations ──
    lines.append("5. TOP 20 MEJORAS EN F1-SCORE (v1 → v2)")
    lines.append("─" * W)
    top_improved = sorted(improved, key=lambda r: r["f1_score_delta"], reverse=True)[:20]
    lines.append(f"  {'Especie':<45} {'F1 v1':>8} {'F1 v2':>8} {'ΔF1':>10} {'ΔPrec':>10} {'ΔRecall':>10}")
    lines.append(f"  {'─' * 45} {'─' * 8} {'─' * 8} {'─' * 10} {'─' * 10} {'─' * 10}")
    for r in top_improved:
        lines.append(
            f"  {r['species']:<45} {_fmt(r['f1_score_v1']):>8} {_fmt(r['f1_score_v2']):>8} "
            f"{_delta_str(r['f1_score_delta']):>10} "
            f"{_delta_str(r['precision_delta']):>10} "
            f"{_delta_str(r['recall_delta']):>10}"
        )
    lines.append("")

    lines.append("6. TOP 20 DEGRADACIONES EN F1-SCORE (v1 → v2)")
    lines.append("─" * W)
    top_degraded = sorted(degraded, key=lambda r: r["f1_score_delta"])[:20]
    lines.append(f"  {'Especie':<45} {'F1 v1':>8} {'F1 v2':>8} {'ΔF1':>10} {'ΔPrec':>10} {'ΔRecall':>10}")
    lines.append(f"  {'─' * 45} {'─' * 8} {'─' * 8} {'─' * 10} {'─' * 10} {'─' * 10}")
    for r in top_degraded:
        lines.append(
            f"  {r['species']:<45} {_fmt(r['f1_score_v1']):>8} {_fmt(r['f1_score_v2']):>8} "
            f"{_delta_str(r['f1_score_delta']):>10} "
            f"{_delta_str(r['precision_delta']):>10} "
            f"{_delta_str(r['recall_delta']):>10}"
        )
    lines.append("")

    # ── 7. New / removed species ──
    if new_sp:
        lines.append(f"7. ESPECIES NUEVAS EN v2 ({len(new_sp)})")
        lines.append("─" * W)
        for r in sorted(new_sp, key=lambda x: x["species"]):
            lines.append(
                f"  {r['species']:<45} P={_fmt(r['precision_v2'])} "
                f"R={_fmt(r['recall_v2'])} F1={_fmt(r['f1_score_v2'])}"
            )
        lines.append("")

    if removed_sp:
        section = 8 if new_sp else 7
        lines.append(f"{section}. ESPECIES ELIMINADAS EN v2 ({len(removed_sp)})")
        lines.append("─" * W)
        for r in sorted(removed_sp, key=lambda x: x["species"]):
            lines.append(
                f"  {r['species']:<45} P={_fmt(r['precision_v1'])} "
                f"R={_fmt(r['recall_v1'])} F1={_fmt(r['f1_score_v1'])}"
            )
        lines.append("")

    # ── Verdict ──
    lines.append(SEP)
    g = global_cmp
    v2_wins = sum(
        1 for k in ("accuracy", "top_5_accuracy") if g[k]["winner"] == "v2 ✓"
    ) + sum(
        1
        for avg_key in ("macro_avg", "weighted_avg")
        for m in g[avg_key].values()
        if m["winner"] == "v2 ✓"
    )
    total_metrics = 2 + sum(len(g[ak]) for ak in ("macro_avg", "weighted_avg"))
    lines.append(f"  VEREDICTO: v2 es mejor en {v2_wins}/{total_metrics} métricas globales.")
    if len(improved) > len(degraded):
        lines.append(f"  A nivel de especie: {len(improved)} mejoraron vs {len(degraded)} empeoraron → v2 gana.")
    elif len(degraded) > len(improved):
        lines.append(f"  A nivel de especie: {len(degraded)} empeoraron vs {len(improved)} mejoraron → v1 gana.")
    else:
        lines.append(f"  A nivel de especie: empate ({len(improved)} mejoraron, {len(degraded)} empeoraron).")
    lines.append(SEP)
    lines.append("")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def write_per_species_csv(output_path: Path, per_species: list[dict]) -> None:
    """Write detailed per-species comparison CSV."""
    fieldnames = [
        "species", "status",
        "precision_v1", "precision_v2", "precision_delta",
        "recall_v1", "recall_v2", "recall_delta",
        "f1_score_v1", "f1_score_v2", "f1_score_delta",
        "support_v1", "support_v2",
    ]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in per_species:
            writer.writerow(row)


def write_summary_json(
    output_path: Path,
    global_cmp: dict,
    per_species: list[dict],
    misclass_cmp: dict,
    tier_info: dict,
) -> None:
    """Write machine-readable comparison summary."""
    both = [r for r in per_species if r["status"] == "both"]
    improved = [r for r in both if r["f1_score_delta"] > 0.001]
    degraded = [r for r in both if r["f1_score_delta"] < -0.001]

    avg_f1_delta = (
        sum(r["f1_score_delta"] for r in both) / len(both) if both else 0.0
    )

    summary = {
        "global_metrics": global_cmp,
        "misclassified": {
            "total_v1": misclass_cmp["total_v1"],
            "total_v2": misclass_cmp["total_v2"],
            "delta": misclass_cmp["delta"],
        },
        "tier_distribution": {
            "v1": tier_info["tiers_v1"],
            "v2": tier_info["tiers_v2"],
        },
        "tier_migrations_count": {
            "improved": len([m for m in tier_info["migrations"] if m["direction"] == "improved"]),
            "degraded": len([m for m in tier_info["migrations"] if m["direction"] == "degraded"]),
        },
        "per_species_summary": {
            "total_compared": len(both),
            "improved": len(improved),
            "degraded": len(degraded),
            "unchanged": len(both) - len(improved) - len(degraded),
            "avg_f1_delta": round(avg_f1_delta, 6),
            "new_in_v2": len([r for r in per_species if r["status"] == "new_in_v2"]),
            "removed_in_v2": len([r for r in per_species if r["status"] == "removed_in_v2"]),
        },
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)


# ── Main ──────────────────────────────────────────────────────────

def validate_version_dir(path: Path, label: str) -> bool:
    """Check that required files exist in a version directory."""
    required = ["evaluation_metrics.json", "per_class_metrics.csv"]
    missing = [f for f in required if not (path / f).exists()]
    if missing:
        print(f"[ERROR] Faltan archivos en {label} ({path}):")
        for f in missing:
            print(f"  - {f}")
        return False
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compara resultados de evaluación entre dos versiones del CNN."
    )
    parser.add_argument("--v1", type=Path, default=DEFAULT_V1,
                        help="Carpeta con evaluación del modelo v1 (anterior)")
    parser.add_argument("--v2", type=Path, default=DEFAULT_V2,
                        help="Carpeta con evaluación del modelo v2 (nuevo)")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT,
                        help="Carpeta de salida para el reporte")
    args = parser.parse_args()

    v1_dir: Path = args.v1.resolve()
    v2_dir: Path = args.v2.resolve()
    output_dir: Path = args.output.resolve()

    print("=" * 60)
    print("  Comparación de Modelos CNN — v1 vs v2")
    print("=" * 60)
    print(f"  v1: {v1_dir}")
    print(f"  v2: {v2_dir}")
    print(f"  Output: {output_dir}")
    print()

    # Validate inputs
    ok = validate_version_dir(v1_dir, "v1") and validate_version_dir(v2_dir, "v2")
    if not ok:
        sys.exit(1)

    # Load data
    print("[1/5] Cargando métricas v1...")
    metrics_v1 = _load_json(v1_dir / "evaluation_metrics.json")
    csv_v1 = _load_csv_metrics(v1_dir / "per_class_metrics.csv")
    mis_v1 = _load_misclassified(v1_dir / "misclassified_samples.json")

    print("[2/5] Cargando métricas v2...")
    metrics_v2 = _load_json(v2_dir / "evaluation_metrics.json")
    csv_v2 = _load_csv_metrics(v2_dir / "per_class_metrics.csv")
    mis_v2 = _load_misclassified(v2_dir / "misclassified_samples.json")

    # Compare
    print("[3/5] Comparando métricas globales...")
    global_cmp = compare_global_metrics(metrics_v1, metrics_v2)
    per_species = compare_per_species(csv_v1, csv_v2)
    misclass_cmp = compare_misclassified(mis_v1, mis_v2)
    tier_info = compute_tier_migration(per_species)

    # Write outputs
    print("[4/5] Generando reporte de texto...")
    output_dir.mkdir(parents=True, exist_ok=True)
    write_text_report(output_dir / "comparison_report.txt", global_cmp, per_species, misclass_cmp, tier_info)
    write_per_species_csv(output_dir / "comparison_per_species.csv", per_species)

    print("[5/5] Generando resumen JSON...")
    write_summary_json(output_dir / "comparison_summary.json", global_cmp, per_species, misclass_cmp, tier_info)

    # Console summary
    both = [r for r in per_species if r["status"] == "both"]
    improved = [r for r in both if r["f1_score_delta"] > 0.001]
    degraded = [r for r in both if r["f1_score_delta"] < -0.001]

    print()
    print("─" * 60)
    print("  RESUMEN RÁPIDO")
    print("─" * 60)

    for key in ("accuracy", "top_5_accuracy"):
        e = global_cmp[key]
        print(f"  {key:<25} v1={_fmt_pct(e['v1'])}  v2={_fmt_pct(e['v2'])}  Δ={_delta_pct_str(e['delta'])}  {e['winner']}")

    macro_f1 = global_cmp["macro_avg"]["f1_score"]
    print(f"  {'macro_avg.f1':<25} v1={_fmt_pct(macro_f1['v1'])}  v2={_fmt_pct(macro_f1['v2'])}  "
          f"Δ={_delta_pct_str(macro_f1['delta'])}  {macro_f1['winner']}")

    print(f"\n  Especies: {len(improved)} mejoraron | {len(degraded)} empeoraron | "
          f"{len(both) - len(improved) - len(degraded)} sin cambio")
    print(f"  Errores:  v1={misclass_cmp['total_v1']}  v2={misclass_cmp['total_v2']}  "
          f"Δ={'+' if misclass_cmp['delta'] > 0 else ''}{misclass_cmp['delta']}")

    # Tier summary
    for tier in (">=0.90", "0.70-0.89", "0.50-0.69", "<0.50"):
        t1 = tier_info["tiers_v1"][tier]
        t2 = tier_info["tiers_v2"][tier]
        d = t2 - t1
        sign = "+" if d > 0 else ""
        print(f"  Tier {tier:<10}  v1={t1:<4} v2={t2:<4} Δ={sign}{d}")

    print()
    print(f"  Reportes generados en: {output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
