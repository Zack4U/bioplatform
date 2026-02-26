/**
 * CatalogFilters — filter bar for the Species Catalog.
 *
 * UI ONLY — all state lives in useSpeciesCatalog hook.
 * Uses Shadcn Select, Button, Badge, Separator, Drawer primitives.
 * Responsive: inline on desktop (md+), bottom Drawer on mobile.
 *
 * WCAG 2.1 AA:
 *  - All selects have visible labels (mobile) + aria-label (desktop).
 *  - Result count uses aria-live="polite" for assistive tech.
 *  - Active filters shown as removable chips with keyboard support.
 *  - Focus management: focus trap in Drawer, visible focus rings.
 *  - Sufficient color contrast on all interactive elements.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { SORT_OPTIONS } from "@/hooks/features/catalog/useSpeciesCatalog";
import type { SelectOption } from "@/types";
import type { SpeciesSearchParams } from "@/types/species";

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface CatalogFiltersProps {
    searchParams: SpeciesSearchParams;
    filterOptions: {
        kingdoms: SelectOption[];
        families: SelectOption[];
        municipalities: SelectOption[];
    };
    activeFilterCount: number;
    hasActiveFilters: boolean;
    currentSort: string;
    totalCount: number;
    onFilterChange: <K extends keyof SpeciesSearchParams>(
        key: K,
        value: SpeciesSearchParams[K],
    ) => void;
    onSortChange: (value: string) => void;
    onClearFilters: () => void;
    className?: string;
}

/* ─── Active filter labels (for chips) ──────────────────────────────────── */

const FILTER_LABELS: Record<string, string> = {
    kingdom: "Reino",
    family: "Familia",
    municipality: "Municipio",
    isSensitive: "Sensibilidad",
};

function getActiveFilters(params: SpeciesSearchParams) {
    const filters: {
        key: keyof SpeciesSearchParams;
        label: string;
        value: string;
    }[] = [];

    if (params.kingdom)
        filters.push({
            key: "kingdom",
            label: FILTER_LABELS.kingdom,
            value: params.kingdom,
        });
    if (params.family)
        filters.push({
            key: "family",
            label: FILTER_LABELS.family,
            value: params.family,
        });
    if (params.municipality)
        filters.push({
            key: "municipality",
            label: FILTER_LABELS.municipality,
            value: params.municipality,
        });
    if (params.isSensitive !== undefined)
        filters.push({
            key: "isSensitive",
            label: FILTER_LABELS.isSensitive,
            value: params.isSensitive ? "Sensibles" : "No sensibles",
        });

    return filters;
}

/* ─── Generic filter select ─────────────────────────────────────────────── */

function FilterSelect({
    id,
    label,
    placeholder,
    value,
    options,
    onValueChange,
    showLabel = false,
}: {
    id: string;
    label: string;
    placeholder: string;
    value: string | undefined;
    options: SelectOption[];
    onValueChange: (value: string) => void;
    showLabel?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={id}
                className={cn(
                    "text-sm font-medium text-foreground",
                    !showLabel && "sr-only",
                )}
            >
                {label}
            </label>
            <Select
                value={value ?? "__all__"}
                onValueChange={(v) => onValueChange(v === "__all__" ? "" : v)}
            >
                <SelectTrigger
                    id={id}
                    className="w-full md:w-44"
                    aria-label={label}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {options.map((opt) => (
                        <SelectItem
                            key={opt.value}
                            value={opt.value}
                            disabled={opt.disabled}
                        >
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

/* ─── Filter controls (shared between desktop inline and mobile drawer) ── */

function FilterControls({
    searchParams,
    filterOptions,
    onFilterChange,
    showLabels = false,
}: Pick<
    CatalogFiltersProps,
    "searchParams" | "filterOptions" | "onFilterChange"
> & {
    showLabels?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex gap-3",
                showLabels ? "flex-col" : "flex-row flex-wrap items-end",
            )}
        >
            <FilterSelect
                id="filter-kingdom"
                label="Reino"
                placeholder="Reino"
                value={searchParams.kingdom}
                options={filterOptions.kingdoms}
                onValueChange={(v) => onFilterChange("kingdom", v || undefined)}
                showLabel={showLabels}
            />
            <FilterSelect
                id="filter-family"
                label="Familia"
                placeholder="Familia"
                value={searchParams.family}
                options={filterOptions.families}
                onValueChange={(v) => onFilterChange("family", v || undefined)}
                showLabel={showLabels}
            />
            <FilterSelect
                id="filter-municipality"
                label="Municipio"
                placeholder="Municipio"
                value={searchParams.municipality}
                options={filterOptions.municipalities}
                onValueChange={(v) =>
                    onFilterChange("municipality", v || undefined)
                }
                showLabel={showLabels}
            />
            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="filter-sensitivity"
                    className={cn(
                        "text-sm font-medium text-foreground",
                        !showLabels && "sr-only",
                    )}
                >
                    Sensibilidad
                </label>
                <Select
                    value={
                        searchParams.isSensitive === undefined
                            ? "__all__"
                            : searchParams.isSensitive
                              ? "true"
                              : "false"
                    }
                    onValueChange={(v) =>
                        onFilterChange(
                            "isSensitive",
                            v === "__all__" ? undefined : v === "true",
                        )
                    }
                >
                    <SelectTrigger
                        id="filter-sensitivity"
                        className="w-full md:w-44"
                        aria-label="Filtrar por sensibilidad"
                    >
                        <SelectValue placeholder="Sensibilidad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        <SelectItem value="true">Solo sensibles</SelectItem>
                        <SelectItem value="false">No sensibles</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

/* ─── Active filter chips ───────────────────────────────────────────────── */

function ActiveFilterChips({
    searchParams,
    onFilterChange,
    onClearFilters,
}: Pick<
    CatalogFiltersProps,
    "searchParams" | "onFilterChange" | "onClearFilters"
>) {
    const filters = getActiveFilters(searchParams);
    if (filters.length === 0) return null;

    return (
        <div
            className="flex flex-wrap items-center gap-2"
            role="list"
            aria-label="Filtros activos"
        >
            {filters.map(({ key, label, value }) => (
                <Badge
                    key={key}
                    variant="secondary"
                    className="gap-1 pl-2.5 pr-1 py-1 text-xs font-medium"
                    role="listitem"
                >
                    <span className="text-muted-foreground">{label}:</span>
                    <span>{value}</span>
                    <button
                        type="button"
                        onClick={() => onFilterChange(key, undefined)}
                        className="ml-0.5 rounded-sm p-0.5 hover:bg-muted-foreground/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring transition-colors"
                        aria-label={`Quitar filtro: ${label} ${value}`}
                    >
                        <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                </Badge>
            ))}
            {filters.length > 1 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                    Limpiar todos
                </Button>
            )}
        </div>
    );
}

/* ─── Main Component ────────────────────────────────────────────────────── */

export function CatalogFilters({
    searchParams,
    filterOptions,
    activeFilterCount,
    hasActiveFilters,
    currentSort,
    totalCount,
    onFilterChange,
    onSortChange,
    onClearFilters,
    className,
}: CatalogFiltersProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <section
            className={cn("space-y-3", className)}
            aria-label="Filtros y ordenamiento del catálogo"
        >
            {/* ── Top bar: result count | sort + filter toggle ─────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Result count — aria-live for screen readers */}
                <p
                    className="text-sm font-medium text-muted-foreground"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {totalCount === 1
                        ? "1 especie encontrada"
                        : `${totalCount.toLocaleString("es-CO")} especies encontradas`}
                </p>

                <div className="flex items-center gap-2">
                    {/* Sort select */}
                    <div className="hidden sm:block">
                        <Select
                            value={currentSort}
                            onValueChange={onSortChange}
                        >
                            <SelectTrigger
                                className="w-52"
                                aria-label="Ordenar por"
                            >
                                <SlidersHorizontal className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Mobile: filter + sort drawer trigger */}
                    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                        <DrawerTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="relative gap-2 md:hidden"
                                aria-label={`Filtros${activeFilterCount > 0 ? ` (${activeFilterCount} activos)` : ""}`}
                            >
                                <Filter
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                <span>Filtros</span>
                                {activeFilterCount > 0 && (
                                    <Badge
                                        variant="default"
                                        className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px] font-bold"
                                    >
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <DrawerHeader>
                                <DrawerTitle>
                                    Filtros y ordenamiento
                                </DrawerTitle>
                                <DrawerDescription>
                                    Ajusta los filtros para refinar tu búsqueda
                                    en el catálogo.
                                </DrawerDescription>
                            </DrawerHeader>

                            <div className="overflow-y-auto px-6 pb-2">
                                {/* Sort (mobile only — hidden on sm+) */}
                                <div className="mb-5 sm:hidden">
                                    <label
                                        htmlFor="drawer-sort"
                                        className="mb-1.5 block text-sm font-medium text-foreground"
                                    >
                                        Ordenar por
                                    </label>
                                    <Select
                                        value={currentSort}
                                        onValueChange={onSortChange}
                                    >
                                        <SelectTrigger
                                            id="drawer-sort"
                                            className="w-full"
                                            aria-label="Ordenar por"
                                        >
                                            <SelectValue placeholder="Ordenar por" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SORT_OPTIONS.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator className="mb-5 sm:hidden" />

                                {/* Filter controls with visible labels */}
                                <FilterControls
                                    searchParams={searchParams}
                                    filterOptions={filterOptions}
                                    onFilterChange={onFilterChange}
                                    showLabels
                                />
                            </div>

                            <DrawerFooter>
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            onClearFilters();
                                            setDrawerOpen(false);
                                        }}
                                        className="w-full"
                                    >
                                        <X
                                            className="mr-2 h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        Limpiar todos los filtros
                                    </Button>
                                )}
                                <DrawerClose asChild>
                                    <Button className="w-full">
                                        Ver resultados ({totalCount})
                                    </Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>

                    {/* Desktop: clear all (only if filters active) */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearFilters}
                            className="hidden md:inline-flex gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            Limpiar filtros
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Desktop inline filters ────────────────────────────────── */}
            <div className="hidden md:block">
                <FilterControls
                    searchParams={searchParams}
                    filterOptions={filterOptions}
                    onFilterChange={onFilterChange}
                />
            </div>

            {/* ── Active filter chips (both desktop and mobile) ─────────── */}
            <ActiveFilterChips
                searchParams={searchParams}
                onFilterChange={onFilterChange}
                onClearFilters={onClearFilters}
            />
        </section>
    );
}
