/**
 * Shared helpers for Model Metrics components.
 *
 * Centralizes color-coding and formatting utilities used across
 * the Model Info dashboard components.
 *
 * @module components/features/identification/model-metrics/helpers
 */

/** Format a species key (underscore-separated) into a readable name. */
export function formatSpeciesName(key: string): string {
    return key.replace(/_/g, " ");
}

/** Get Tailwind text-color class based on a 0–1 metric value. */
export function metricColor(value: number): string {
    if (value >= 0.9) return "text-emerald-500";
    if (value >= 0.7) return "text-amber-500";
    return "text-red-500";
}

/** Get Tailwind bg-color class for metric progress bars. */
export function metricBarColor(value: number): string {
    if (value >= 0.9) return "bg-emerald-500";
    if (value >= 0.7) return "bg-amber-500";
    return "bg-red-500";
}

/** Get Tailwind bg-color class for F1 histogram bars (position-based). */
export function histogramBarColor(index: number, total: number): string {
    const ratio = index / (total - 1);
    if (ratio < 0.5) return "bg-red-500/80";
    if (ratio < 0.7) return "bg-amber-500/80";
    return "bg-emerald-500/80";
}

/** Sort direction for tables. */
export type SortDir = "asc" | "desc";

/** Sortable column keys for the per-species table. */
export type SortKey = "name" | "precision" | "recall" | "f1Score" | "support";
