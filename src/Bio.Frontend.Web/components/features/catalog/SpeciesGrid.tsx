/**
 * SpeciesGrid — responsive grid/list layout for species cards.
 *
 * UI ONLY — renders species items in the selected view mode.
 * Delegates to SpeciesCard for individual rendering.
 * Shows loading skeletons, empty state, or error fallback.
 * WCAG: aria-live region, landmark region.
 */

"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorFallback } from "@/components/common/ErrorFallback";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Grid3X3, List, SearchX } from "lucide-react";

import type { ViewMode } from "@/hooks/features/catalog/useSpeciesCatalog";
import type { SpeciesListItem } from "@/types/species";
import { SpeciesCard, SpeciesCardSkeleton } from "./SpeciesCard";

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface SpeciesGridProps {
    species: SpeciesListItem[];
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    isEmpty: boolean;
    hasActiveFilters: boolean;
    onRetry: () => void;
    onClearFilters: () => void;
    className?: string;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function SpeciesGrid({
    species,
    viewMode,
    onViewModeChange,
    isLoading,
    isFetching,
    isError,
    isEmpty,
    hasActiveFilters,
    onRetry,
    onClearFilters,
    className,
}: SpeciesGridProps) {
    /* ── Error state ─────────────────────────────────────────────────────── */

    if (isError) {
        return (
            <ErrorFallback
                title="Error al cargar especies"
                message="No pudimos obtener los datos del catálogo. Verifica tu conexión e intenta nuevamente."
                onRetry={onRetry}
            />
        );
    }

    /* ── Loading (initial) ───────────────────────────────────────────────── */

    if (isLoading) {
        return (
            <div className={cn("space-y-4", className)}>
                <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
                <div
                    className={cn(
                        viewMode === "grid"
                            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "flex flex-col gap-3",
                    )}
                    aria-busy="true"
                >
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SpeciesCardSkeleton key={i} viewMode={viewMode} />
                    ))}
                </div>
            </div>
        );
    }

    /* ── Empty state ─────────────────────────────────────────────────────── */

    if (isEmpty) {
        return (
            <div className={cn("space-y-4", className)}>
                <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
                <EmptyState
                    icon={<SearchX className="h-8 w-8" />}
                    title="No se encontraron especies"
                    description={
                        hasActiveFilters
                            ? "Intenta ajustar los filtros de búsqueda para ver más resultados."
                            : "Aún no hay especies registradas en el catálogo."
                    }
                    action={
                        hasActiveFilters ? (
                            <Button variant="outline" onClick={onClearFilters}>
                                Limpiar filtros
                            </Button>
                        ) : undefined
                    }
                />
            </div>
        );
    }

    /* ── Species grid/list ───────────────────────────────────────────────── */

    return (
        <div className={cn("space-y-4", className)}>
            <ViewModeToggle value={viewMode} onChange={onViewModeChange} />

            <div
                role="region"
                aria-label="Resultados del catálogo"
                aria-busy={isFetching}
                className={cn(
                    "transition-opacity duration-200",
                    isFetching && "opacity-60",
                    viewMode === "grid"
                        ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        : "flex flex-col gap-3",
                )}
            >
                {species.map((item) => (
                    <SpeciesCard
                        key={item.id}
                        species={item}
                        viewMode={viewMode}
                    />
                ))}
            </div>
        </div>
    );
}

/* ─── View mode toggle (grid / list) ────────────────────────────────────── */

function ViewModeToggle({
    value,
    onChange,
}: {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
}) {
    return (
        <div className="flex justify-end">
            <ToggleGroup
                type="single"
                value={value}
                onValueChange={(v) => {
                    if (v) onChange(v as ViewMode);
                }}
                aria-label="Modo de vista"
            >
                <ToggleGroupItem
                    value="grid"
                    aria-label="Vista en cuadrícula"
                    size="sm"
                >
                    <Grid3X3 className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                    value="list"
                    aria-label="Vista en lista"
                    size="sm"
                >
                    <List className="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}
