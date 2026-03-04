/**
 * CatalogFiltersSidebar — accordion-based side panel for species filters.
 *
 * UI ONLY — all state lives in useSpeciesCatalog hook.
 * Design reference: 2-panel layout with collapsible accordion sections.
 *
 * Sections: Reino, Filo, Familia, Género, Sensibilidad, Estado de Conservación.
 * Each section is an accordion item with checkboxes / selects.
 *
 * WCAG 2.1 AA:
 *  - Accordion uses aria-expanded, aria-controls.
 *  - All inputs have associated labels.
 *  - Active filter count displayed with aria-live.
 *  - Keyboard navigable (Tab, Space, Enter).
 */

"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

import type { SelectOption } from "@/types";
import type { SpeciesSearchParams } from "@/types/species";

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface CatalogFiltersSidebarProps {
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
    onFilterChange: <K extends keyof SpeciesSearchParams>(
        key: K,
        value: SpeciesSearchParams[K],
    ) => void;
    onClearFilters: () => void;
    /** Hide the header row (title + clear). Defaults to true. */
    showHeader?: boolean;
    className?: string;
}

/* ─── Filter section with checkbox list ─────────────────────────────────── */

function CheckboxFilterSection({
    filterId,
    label,
    options,
    selectedValue,
    onSelect,
}: {
    filterId: string;
    label: string;
    options: SelectOption[];
    selectedValue: string | undefined;
    onSelect: (value: string | undefined) => void;
}) {
    const hasSelection = !!selectedValue;

    return (
        <AccordionItem value={filterId} className="border-b px-1">
            <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                    {label}
                    {hasSelection && (
                        <Badge
                            variant="secondary"
                            className="h-5 min-w-5 rounded-full px-1.5 text-[10px] font-bold"
                        >
                            1
                        </Badge>
                    )}
                </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
                <div
                    className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1"
                    role="group"
                    aria-label={`Filtrar por ${label}`}
                >
                    {options.map((opt) => {
                        const isChecked = selectedValue === opt.value;
                        return (
                            <label
                                key={opt.value}
                                className={cn(
                                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                                    "hover:bg-accent",
                                    isChecked && "bg-accent",
                                )}
                            >
                                <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                        onSelect(
                                            checked ? opt.value : undefined,
                                        )
                                    }
                                    aria-label={opt.label}
                                />
                                <span className="truncate">{opt.label}</span>
                            </label>
                        );
                    })}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

/* ─── Main Component ────────────────────────────────────────────────────── */

export function CatalogFiltersSidebar({
    searchParams,
    filterOptions,
    activeFilterCount,
    hasActiveFilters,
    onFilterChange,
    onClearFilters,
    showHeader = true,
    className,
}: CatalogFiltersSidebarProps) {
    return (
        <aside
            className={cn("flex flex-col", className)}
            aria-label="Filtros del catálogo"
        >
            {/* ── Header ───────────────────────────────────────────────── */}
            {showHeader && (
                <>
                    <div className="flex items-center justify-between pb-2">
                        <h2 className="text-lg font-bold tracking-tight">
                            Filtros
                        </h2>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearFilters}
                                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3 w-3" aria-hidden="true" />
                                Limpiar
                            </Button>
                        )}
                    </div>

                    <Separator className="mb-1" />
                </>
            )}

            {/* ── Active filter count ──────────────────────────────────── */}
            {activeFilterCount > 0 && (
                <p
                    className="px-1 py-2 text-xs text-muted-foreground"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {activeFilterCount === 1
                        ? "1 filtro activo"
                        : `${activeFilterCount} filtros activos`}
                </p>
            )}

            {/* ── Accordion filters ────────────────────────────────────── */}
            <Accordion
                type="multiple"
                defaultValue={[
                    "reino",
                    "filo",
                    "familia",
                    "genero",
                    "sensibilidad",
                    "conservacion",
                ]}
                className="w-full"
            >
                {/* Reino */}
                <CheckboxFilterSection
                    filterId="reino"
                    label="Reino"
                    options={filterOptions.kingdoms}
                    selectedValue={searchParams.kingdom}
                    onSelect={(v) => onFilterChange("kingdom", v)}
                />

                {/* Filo */}
                <CheckboxFilterSection
                    filterId="filo"
                    label="Filo"
                    options={filterOptions.phylums}
                    selectedValue={searchParams.phylum}
                    onSelect={(v) => onFilterChange("phylum", v)}
                />

                {/* Familia */}
                <CheckboxFilterSection
                    filterId="familia"
                    label="Familia"
                    options={filterOptions.families}
                    selectedValue={searchParams.family}
                    onSelect={(v) => onFilterChange("family", v)}
                />

                {/* Género */}
                <CheckboxFilterSection
                    filterId="genero"
                    label="Género"
                    options={filterOptions.genera}
                    selectedValue={searchParams.genus}
                    onSelect={(v) => onFilterChange("genus", v)}
                />

                {/* Sensibilidad */}
                <AccordionItem value="sensibilidad" className="border-b px-1">
                    <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                        <span className="flex items-center gap-2">
                            Sensibilidad
                            {searchParams.isSensitive !== undefined && (
                                <Badge
                                    variant="secondary"
                                    className="h-5 min-w-5 rounded-full px-1.5 text-[10px] font-bold"
                                >
                                    1
                                </Badge>
                            )}
                        </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                        <div
                            className="flex flex-col gap-2"
                            role="group"
                            aria-label="Filtrar por sensibilidad"
                        >
                            <label
                                className={cn(
                                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors hover:bg-accent",
                                    searchParams.isSensitive === true &&
                                        "bg-accent",
                                )}
                            >
                                <Checkbox
                                    checked={searchParams.isSensitive === true}
                                    onCheckedChange={(checked) =>
                                        onFilterChange(
                                            "isSensitive",
                                            checked ? true : undefined,
                                        )
                                    }
                                    aria-label="Solo sensibles"
                                />
                                <span>Solo sensibles</span>
                            </label>
                            <label
                                className={cn(
                                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors hover:bg-accent",
                                    searchParams.isSensitive === false &&
                                        "bg-accent",
                                )}
                            >
                                <Checkbox
                                    checked={searchParams.isSensitive === false}
                                    onCheckedChange={(checked) =>
                                        onFilterChange(
                                            "isSensitive",
                                            checked ? false : undefined,
                                        )
                                    }
                                    aria-label="No sensibles"
                                />
                                <span>No sensibles</span>
                            </label>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Estado de Conservación */}
                <CheckboxFilterSection
                    filterId="conservacion"
                    label="Estado de Conservación"
                    options={filterOptions.conservationStatuses}
                    selectedValue={searchParams.conservationStatus}
                    onSelect={(v) => onFilterChange("conservationStatus", v)}
                />
            </Accordion>
        </aside>
    );
}
