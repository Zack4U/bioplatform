/**
 * ModelMetricsSpeciesTable — Searchable, sortable per-species metrics table.
 *
 * Features:
 *   - Search by species name
 *   - Sort by any column (name, precision, recall, F1, support)
 *   - Color-coded metric bars + percentages
 *   - Pagination (20 items per page)
 *
 * Self-contained state — fully encapsulated from the page.
 *
 * @module components/features/identification/model-metrics/ModelMetricsSpeciesTable
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ModelMetricsResponse } from "@/types";
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
    formatSpeciesName,
    metricBarColor,
    metricColor,
    type SortDir,
    type SortKey,
} from "./helpers";

// ── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 20;

// ── Types ────────────────────────────────────────────────────────────────────

interface SpeciesRow {
    name: string;
    key: string;
    precision: number;
    recall: number;
    f1Score: number;
    support: number;
}

interface ModelMetricsSpeciesTableProps {
    metrics: ModelMetricsResponse;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ModelMetricsSpeciesTable({
    metrics,
}: ModelMetricsSpeciesTableProps) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("f1Score");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [page, setPage] = useState(1);

    // ── Derived data ─────────────────────────────────────────────────────────
    const speciesList: SpeciesRow[] = useMemo(() => {
        if (!metrics.perClass) return [];
        return Object.entries(metrics.perClass).map(([key, m]) => ({
            name: formatSpeciesName(key),
            key,
            ...m,
        }));
    }, [metrics.perClass]);

    const filteredSorted = useMemo(() => {
        let list = speciesList;

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((s) => s.name.toLowerCase().includes(q));
        }

        list = [...list].sort((a, b) => {
            const aVal = sortKey === "name" ? a.name : a[sortKey];
            const bVal = sortKey === "name" ? b.name : b[sortKey];
            if (typeof aVal === "string" && typeof bVal === "string") {
                return sortDir === "asc"
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            return sortDir === "asc"
                ? (aVal as number) - (bVal as number)
                : (bVal as number) - (aVal as number);
        });

        return list;
    }, [speciesList, search, sortKey, sortDir]);

    const totalPages = Math.ceil(filteredSorted.length / ITEMS_PER_PAGE);
    const pageItems = filteredSorted.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE,
    );

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir(key === "name" ? "asc" : "desc");
        }
        setPage(1);
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Rendimiento por Especie ({filteredSorted.length})
                    </CardTitle>
                    <div className="relative max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Buscar especie..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <SortableHeader
                                    label="Especie"
                                    sortKey="name"
                                    currentKey={sortKey}
                                    dir={sortDir}
                                    onSort={handleSort}
                                    className="text-left"
                                />
                                <SortableHeader
                                    label="Precision"
                                    sortKey="precision"
                                    currentKey={sortKey}
                                    dir={sortDir}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Recall"
                                    sortKey="recall"
                                    currentKey={sortKey}
                                    dir={sortDir}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="F1-Score"
                                    sortKey="f1Score"
                                    currentKey={sortKey}
                                    dir={sortDir}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Soporte"
                                    sortKey="support"
                                    currentKey={sortKey}
                                    dir={sortDir}
                                    onSort={handleSort}
                                />
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.map((species) => (
                                <tr
                                    key={species.key}
                                    className="border-b transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-4 py-2.5">
                                        <span className="font-medium italic">
                                            {species.name}
                                        </span>
                                    </td>
                                    <MetricCell value={species.precision} />
                                    <MetricCell value={species.recall} />
                                    <MetricCell value={species.f1Score} />
                                    <td className="px-4 py-2.5 text-center text-muted-foreground">
                                        {species.support}
                                    </td>
                                </tr>
                            ))}
                            {pageItems.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No se encontraron especies con
                                        &quot;{search}&quot;
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Pagina {page} de {totalPages} ·{" "}
                            {filteredSorted.length} especies
                        </p>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ── SortableHeader (private) ─────────────────────────────────────────────────

function SortableHeader({
    label,
    sortKey: key,
    currentKey,
    dir,
    onSort,
    className,
}: {
    label: string;
    sortKey: SortKey;
    currentKey: SortKey;
    dir: SortDir;
    onSort: (key: SortKey) => void;
    className?: string;
}) {
    const isActive = currentKey === key;
    return (
        <th
            className={cn(
                "cursor-pointer select-none px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
                className,
            )}
            onClick={() => onSort(key)}
        >
            <div
                className={cn(
                    "flex items-center gap-1",
                    className !== "text-left" && "justify-center",
                )}
            >
                {label}
                <ArrowUpDown
                    className={cn(
                        "h-3 w-3",
                        isActive
                            ? "text-foreground"
                            : "text-muted-foreground/50",
                    )}
                />
                {isActive && (
                    <span className="text-[9px]">
                        {dir === "asc" ? "↑" : "↓"}
                    </span>
                )}
            </div>
        </th>
    );
}

// ── MetricCell (private) ─────────────────────────────────────────────────────

function MetricCell({ value }: { value: number }) {
    const pct = (value * 100).toFixed(1);
    return (
        <td className="px-4 py-2.5">
            <div className="flex items-center justify-center gap-2">
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all",
                            metricBarColor(value),
                        )}
                        style={{ width: `${value * 100}%` }}
                    />
                </div>
                <span
                    className={cn(
                        "w-12 text-right text-xs font-semibold",
                        metricColor(value),
                    )}
                >
                    {pct}%
                </span>
            </div>
        </td>
    );
}
