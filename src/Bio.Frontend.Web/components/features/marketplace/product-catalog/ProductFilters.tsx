/**
 * ProductFilters — sidebar + mobile sheet filters for the Marketplace.
 *
 * Architecture mirrors CatalogFiltersSidebar + CatalogFiltersMobile exactly:
 *   - Desktop: Accordion-based sidebar with checkbox-style sections
 *   - Mobile: Sheet reusing the same sidebar component
 *
 * Filter sections: Categoría, Precio, Valoración mínima
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
import { cn } from "@/lib/utils";
import type { ProductCategory, ProductSearchParams } from "@/types/marketplace";
import { Filter, Star, X } from "lucide-react";
import { useState } from "react";

/* ─── Price range options ───────────────────────────────────────────────── */

const PRICE_RANGES = [
    { label: "Hasta $25.000", min: undefined, max: 25000 },
    { label: "$25.000 - $50.000", min: 25000, max: 50000 },
    { label: "$50.000 - $100.000", min: 50000, max: 100000 },
    { label: "Más de $100.000", min: 100000, max: undefined },
] as const;

/* ─── Rating options ────────────────────────────────────────────────────── */

const RATING_OPTIONS = [
    { label: "4+ estrellas", value: 4 },
    { label: "3+ estrellas", value: 3 },
    { label: "2+ estrellas", value: 2 },
] as const;

/* ─── Sidebar Props ─────────────────────────────────────────────────────── */

interface ProductFiltersSidebarProps {
    searchParams: ProductSearchParams;
    categories: ProductCategory[];
    activeFilterCount: number;
    hasActiveFilters: boolean;
    onFilterChange: <K extends keyof ProductSearchParams>(
        key: K,
        value: ProductSearchParams[K],
    ) => void;
    onClearFilters: () => void;
    /** Hide the header row (title + clear). Defaults to true. */
    showHeader?: boolean;
    className?: string;
}

/* ─── Sidebar Component ─────────────────────────────────────────────────── */

export function ProductFiltersSidebar({
    searchParams,
    categories,
    activeFilterCount,
    hasActiveFilters,
    onFilterChange,
    onClearFilters,
    showHeader = true,
    className,
}: ProductFiltersSidebarProps) {
    /* ── Derived: active price range ─────────────────────────────────── */
    const activePriceRange = PRICE_RANGES.find(
        (r) =>
            r.min === searchParams.minPrice &&
            r.max === searchParams.maxPrice,
    );

    const hasCategoryFilter = !!searchParams.categoryId;
    const hasPriceFilter =
        searchParams.minPrice !== undefined ||
        searchParams.maxPrice !== undefined;
    const hasRatingFilter = searchParams.minRating !== undefined;

    return (
        <aside
            className={cn("flex flex-col", className)}
            aria-label="Filtros de productos"
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
                defaultValue={["categoria", "precio", "valoracion"]}
                className="w-full"
            >
                {/* Categoría */}
                <AccordionItem value="categoria" className="border-b px-1">
                    <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                        <span className="flex items-center gap-2">
                            Categoría
                            {hasCategoryFilter && (
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
                            aria-label="Filtrar por categoría"
                        >
                            {categories.map((cat) => {
                                const isChecked =
                                    searchParams.categoryId === cat.id;
                                return (
                                    <label
                                        key={cat.id}
                                        className={cn(
                                            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                                            "hover:bg-accent",
                                            isChecked && "bg-accent",
                                        )}
                                    >
                                        <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={(checked) =>
                                                onFilterChange(
                                                    "categoryId",
                                                    checked
                                                        ? cat.id
                                                        : undefined,
                                                )
                                            }
                                            aria-label={cat.name}
                                        />
                                        <span className="truncate">
                                            {cat.name}
                                        </span>
                                        {cat.productCount !== undefined && (
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                {cat.productCount}
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Precio */}
                <AccordionItem value="precio" className="border-b px-1">
                    <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                        <span className="flex items-center gap-2">
                            Precio
                            {hasPriceFilter && (
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
                            aria-label="Filtrar por precio"
                        >
                            {PRICE_RANGES.map((range) => {
                                const isChecked =
                                    activePriceRange?.label === range.label;
                                return (
                                    <label
                                        key={range.label}
                                        className={cn(
                                            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                                            "hover:bg-accent",
                                            isChecked && "bg-accent",
                                        )}
                                    >
                                        <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={(checked) => {
                                                onFilterChange(
                                                    "minPrice",
                                                    checked
                                                        ? range.min
                                                        : undefined,
                                                );
                                                onFilterChange(
                                                    "maxPrice",
                                                    checked
                                                        ? range.max
                                                        : undefined,
                                                );
                                            }}
                                            aria-label={range.label}
                                        />
                                        <span className="truncate">
                                            {range.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Valoración mínima */}
                <AccordionItem value="valoracion" className="border-b px-1">
                    <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                        <span className="flex items-center gap-2">
                            Valoración mínima
                            {hasRatingFilter && (
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
                            aria-label="Filtrar por valoración mínima"
                        >
                            {RATING_OPTIONS.map((opt) => {
                                const isChecked =
                                    searchParams.minRating === opt.value;
                                return (
                                    <label
                                        key={opt.label}
                                        className={cn(
                                            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                                            "hover:bg-accent",
                                            isChecked && "bg-accent",
                                        )}
                                    >
                                        <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={(checked) =>
                                                onFilterChange(
                                                    "minRating",
                                                    checked
                                                        ? opt.value
                                                        : undefined,
                                                )
                                            }
                                            aria-label={opt.label}
                                        />
                                        <span className="flex items-center gap-1">
                                            <span className="flex items-center gap-0.5">
                                                {Array.from(
                                                    { length: opt.value },
                                                    (_, i) => (
                                                        <Star
                                                            key={i}
                                                            className="h-3 w-3 fill-amber-400 text-amber-400"
                                                            aria-hidden="true"
                                                        />
                                                    ),
                                                )}
                                            </span>
                                            {opt.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </aside>
    );
}

/* ─── Mobile Sheet ──────────────────────────────────────────────────────── */

interface ProductFiltersMobileProps {
    searchParams: ProductSearchParams;
    categories: ProductCategory[];
    activeFilterCount: number;
    hasActiveFilters: boolean;
    totalCount: number;
    onFilterChange: <K extends keyof ProductSearchParams>(
        key: K,
        value: ProductSearchParams[K],
    ) => void;
    onClearFilters: () => void;
}

export function ProductFiltersMobile({
    searchParams,
    categories,
    activeFilterCount,
    hasActiveFilters,
    totalCount,
    onFilterChange,
    onClearFilters,
}: ProductFiltersMobileProps) {
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
                        marketplace.
                    </SheetDescription>
                </SheetHeader>

                {/* Reuse the same filter sidebar */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <ProductFiltersSidebar
                        searchParams={searchParams}
                        categories={categories}
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
