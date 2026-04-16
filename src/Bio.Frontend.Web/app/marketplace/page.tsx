/**
 * /marketplace — Product Catalog page (2-panel layout).
 *
 * Layout mirrors /catalog:
 *  ┌──────────────────────────────────────────────────┐
 *  │ PageHeader + SearchInput                         │
 *  ├──────────┬───────────────────────────────────────┤
 *  │ Filters  │ Toolbar: [≡ Filtros] [count] [Sort|📊]│
 *  │ (sidebar)│ ProductGrid                           │
 *  │          │ Pagination                            │
 *  └──────────┴───────────────────────────────────────┘
 *
 * All logic delegated to useProductCatalog hook.
 * URL sync: useProductCatalog reads/writes URL search params.
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 */

"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { SearchInput } from "@/components/common/SearchInput";
import {
    ProductFiltersMobile,
    ProductFiltersSidebar,
    ProductGrid,
} from "@/components/features/marketplace/product-catalog";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductCatalog } from "@/hooks/features/marketplace/useProductCatalog";
import { cn } from "@/lib/utils";
import { Suspense, useState } from "react";

/* ─── Fallback while searchParams resolve ───────────────────────────────── */

function CatalogSkeleton() {
    return (
        <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-full max-w-2xl" />
            <div className="flex gap-6">
                <Skeleton className="hidden md:block h-150 w-64 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className="aspect-3/4 rounded-xl"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Inner component (uses useSearchParams via the hook) ───────────────── */

function MarketplaceContent() {
    const catalog = useProductCatalog();
    const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(true);

    return (
        <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {/* ── Header ─────────────────────────────────────────────── */}
            <PageHeader
                title="Marketplace Sostenible"
                description="Descubre productos de biocomercio del departamento de Caldas. Artesanías, alimentos orgánicos, cosméticos naturales y más."
                breadcrumbs={[
                    { label: "Inicio", href: "/" },
                    { label: "Marketplace" },
                ]}
            />

            {/* ── Search ─────────────────────────────────────────────── */}
            <section className="mb-6" aria-label="Búsqueda de productos">
                <SearchInput
                    placeholder="Buscar por nombre, categoría, especie..."
                    value={catalog.searchParams.query ?? ""}
                    onChange={catalog.setSearch}
                    aria-label="Buscar productos en el marketplace"
                    className="max-w-2xl"
                />
            </section>

            {/* ── 2-Panel Layout ─────────────────────────────────── */}
            <div className="flex gap-6">
                {/* Left: Filters sidebar (desktop only) */}
                <div
                    className={cn(
                        "hidden md:block shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
                        isFiltersPanelOpen
                            ? "w-64 opacity-100"
                            : "w-0 opacity-0",
                    )}
                >
                    <div className="w-64 sticky top-6">
                        <ProductFiltersSidebar
                            searchParams={catalog.searchParams}
                            categories={catalog.categories}
                            activeFilterCount={catalog.activeFilterCount}
                            hasActiveFilters={catalog.hasActiveFilters}
                            onFilterChange={catalog.setFilter}
                            onClearFilters={catalog.clearFilters}
                        />
                    </div>
                </div>

                {/* Right: Grid + Pagination */}
                <div className="flex-1 min-w-0">
                    <ProductGrid
                        products={catalog.products}
                        viewMode={catalog.viewMode}
                        onViewModeChange={catalog.setViewMode}
                        isLoading={catalog.isLoading}
                        isFetching={catalog.isFetching}
                        isError={catalog.isError}
                        isEmpty={catalog.isEmpty}
                        hasActiveFilters={catalog.hasActiveFilters}
                        totalCount={catalog.totalCount}
                        currentSort={catalog.currentSort}
                        onSortChange={catalog.setSort}
                        isFiltersPanelOpen={isFiltersPanelOpen}
                        onToggleFiltersPanel={() =>
                            setIsFiltersPanelOpen((prev) => !prev)
                        }
                        mobileFilterSlot={
                            <ProductFiltersMobile
                                searchParams={catalog.searchParams}
                                categories={catalog.categories}
                                activeFilterCount={catalog.activeFilterCount}
                                hasActiveFilters={catalog.hasActiveFilters}
                                totalCount={catalog.totalCount}
                                onFilterChange={catalog.setFilter}
                                onClearFilters={catalog.clearFilters}
                            />
                        }
                        onRetry={catalog.refetch}
                        onClearFilters={catalog.clearFilters}
                    />

                    {/* ── Pagination ─────────────────────────────────── */}
                    {!catalog.isLoading && !catalog.isError && (
                        <Pagination
                            currentPage={catalog.currentPage}
                            totalPages={catalog.totalPages}
                            onPageChange={catalog.setPage}
                            className="mt-8"
                        />
                    )}
                </div>
            </div>
        </main>
    );
}

/* ─── Page (wrapped in Suspense for useSearchParams) ────────────────────── */

export default function MarketplacePage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <MarketplaceContent />
        </Suspense>
    );
}
