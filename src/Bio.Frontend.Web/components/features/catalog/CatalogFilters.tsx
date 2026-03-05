/**
 * CatalogFiltersMobile — mobile-only filter panel for the Species Catalog.
 *
 * Opens as a Sheet (side panel from the left) reusing the same
 * CatalogFiltersSidebar accordion content.
 *
 * UI ONLY — all state lives in useSpeciesCatalog hook.
 *
 * WCAG 2.1 AA:
 *  - Sheet uses focus trap + aria-label.
 *  - Close via X button, overlay click, or Escape key.
 *  - Active filter count announced with aria-live.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";
import { useState } from "react";

import { CatalogFiltersSidebar } from "./CatalogFiltersSidebar";

import type { SelectOption } from "@/types";
import type { SpeciesSearchParams } from "@/types/species";

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface CatalogFiltersMobileProps {
    searchParams: SpeciesSearchParams;
    filterOptions: {
        kingdoms: SelectOption[];
        phylums: SelectOption[];
        families: SelectOption[];
        genera: SelectOption[];
        conservationStatuses: SelectOption[];
    };
    activeFilterCount: number;
    hasActiveFilters: boolean;
    totalCount: number;
    onFilterChange: <K extends keyof SpeciesSearchParams>(
        key: K,
        value: SpeciesSearchParams[K],
    ) => void;
    onClearFilters: () => void;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function CatalogFiltersMobile({
    searchParams,
    filterOptions,
    activeFilterCount,
    hasActiveFilters,
    totalCount,
    onFilterChange,
    onClearFilters,
}: CatalogFiltersMobileProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="relative gap-2 md:hidden"
                    aria-label={`Filtros${activeFilterCount > 0 ? ` (${activeFilterCount} activos)` : ""}`}
                >
                    <Filter className="h-4 w-4" aria-hidden="true" />
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
            </SheetTrigger>

            <SheetContent side="left" className="w-80 p-0 flex flex-col">
                <SheetHeader className="px-5 pt-5 pb-0">
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>
                        Ajusta los filtros para refinar tu búsqueda en el
                        catálogo.
                    </SheetDescription>
                </SheetHeader>

                {/* Reuse the same filter sidebar */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <CatalogFiltersSidebar
                        searchParams={searchParams}
                        filterOptions={filterOptions}
                        activeFilterCount={activeFilterCount}
                        hasActiveFilters={hasActiveFilters}
                        onFilterChange={onFilterChange}
                        onClearFilters={onClearFilters}
                        showHeader={false}
                    />
                </div>

                <SheetFooter className="border-t px-5">
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                onClearFilters();
                                setOpen(false);
                            }}
                            className="w-full"
                        >
                            <X className="mr-2 h-4 w-4" aria-hidden="true" />
                            Limpiar todos los filtros
                        </Button>
                    )}
                    <SheetClose asChild>
                        <Button className="w-full">
                            Ver resultados ({totalCount.toLocaleString("es-CO")}
                            )
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
