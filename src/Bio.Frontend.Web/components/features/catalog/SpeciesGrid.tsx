/**
 * SpeciesGrid — responsive grid/list layout for species cards.
 *
 * UI ONLY — renders species items in the selected view mode.
 * Delegates to SpeciesCard for individual rendering.
 * Shows loading skeletons, empty state, or error fallback.
 *
 * Toolbar: [Filter toggle (left)] ... [Sort dropdown | View mode toggle (right)]
 * WCAG: aria-live region, landmark region.
 */

"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorFallback } from "@/components/common/ErrorFallback";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
    ArrowDownUp,
    Grid3X3,
    List,
    PanelLeftClose,
    PanelLeftOpen,
    SearchX,
} from "lucide-react";

import type { ReactNode } from "react";

import {
    SORT_OPTIONS,
    type ViewMode,
} from "@/hooks/features/catalog/useSpeciesCatalog";
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
    totalCount: number;
    currentSort: string;
    onSortChange: (value: string) => void;
    isFiltersPanelOpen: boolean;
    onToggleFiltersPanel: () => void;
    /** Slot for the mobile filter Sheet trigger (rendered in the toolbar on <md). */
    mobileFilterSlot?: ReactNode;
    onRetry: () => void;
    onClearFilters: () => void;
    className?: string;
}

/* ─── Toolbar ───────────────────────────────────────────────────────────── */

function CatalogToolbar({
    viewMode,
    onViewModeChange,
    totalCount,
    currentSort,
    onSortChange,
    isFiltersPanelOpen,
    onToggleFiltersPanel,
    mobileFilterSlot,
}: Pick<
    SpeciesGridProps,
    | "viewMode"
    | "onViewModeChange"
    | "totalCount"
    | "currentSort"
    | "onSortChange"
    | "isFiltersPanelOpen"
    | "onToggleFiltersPanel"
    | "mobileFilterSlot"
>) {
    return (
        <div className="flex items-center justify-between gap-3">
            {/* Left: filter toggle + result count */}
            <div className="flex items-center gap-3">
                {/* Desktop: sidebar panel toggle */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleFiltersPanel}
                    className="hidden md:inline-flex gap-2"
                    aria-label={
                        isFiltersPanelOpen
                            ? "Ocultar panel de filtros"
                            : "Mostrar panel de filtros"
                    }
                    aria-expanded={isFiltersPanelOpen}
                >
                    {isFiltersPanelOpen ? (
                        <PanelLeftClose className="h-4 w-4" />
                    ) : (
                        <PanelLeftOpen className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Filtros</span>
                </Button>

                {/* Mobile: Sheet filter trigger (slot from parent) */}
                {mobileFilterSlot}

                <p
                    className="text-sm text-muted-foreground whitespace-nowrap"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {totalCount === 1
                        ? "1 especie"
                        : `${totalCount.toLocaleString("es-CO")} especies`}
                </p>
            </div>

            {/* Right: sort + view mode */}
            <div className="flex items-center gap-2">
                {/* Sort dropdown */}
                <Select value={currentSort} onValueChange={onSortChange}>
                    <SelectTrigger
                        className="w-auto gap-2 text-sm"
                        aria-label="Ordenar por"
                    >
                        <ArrowDownUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* View mode toggle */}
                <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(v) => {
                        if (v) onViewModeChange(v as ViewMode);
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
        </div>
    );
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
    totalCount,
    currentSort,
    onSortChange,
    isFiltersPanelOpen,
    onToggleFiltersPanel,
    mobileFilterSlot,
    onRetry,
    onClearFilters,
    className,
}: SpeciesGridProps) {
    const toolbar = (
        <CatalogToolbar
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            totalCount={totalCount}
            currentSort={currentSort}
            onSortChange={onSortChange}
            isFiltersPanelOpen={isFiltersPanelOpen}
            onToggleFiltersPanel={onToggleFiltersPanel}
            mobileFilterSlot={mobileFilterSlot}
        />
    );

    /* ── Error state ─────────────────────────────────────────────────────── */

    if (isError) {
        return (
            <div className={cn("space-y-4", className)}>
                {toolbar}
                <ErrorFallback
                    title="Error al cargar especies"
                    message="No pudimos obtener los datos del catálogo. Verifica tu conexión e intenta nuevamente."
                    onRetry={onRetry}
                />
            </div>
        );
    }

    /* ── Loading (initial) ───────────────────────────────────────────────── */

    if (isLoading) {
        return (
            <div className={cn("space-y-4", className)}>
                {toolbar}
                <div
                    className={cn(
                        viewMode === "grid"
                            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
                {toolbar}
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
            {toolbar}

            <div
                role="region"
                aria-label="Resultados del catálogo"
                aria-busy={isFetching}
                className={cn(
                    "transition-opacity duration-200",
                    isFetching && "opacity-60",
                    viewMode === "grid"
                        ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
