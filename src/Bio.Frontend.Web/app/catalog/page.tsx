/**
 * /catalog — Species Catalog page.
 *
 * Modular composition: PageHeader + SearchInput + CatalogFilters + SpeciesGrid + Pagination.
 * All logic delegated to useSpeciesCatalog hook.
 * UI components are stateless — they only receive props and render.
 *
 * URL sync: useSpeciesCatalog reads/writes URL search params. Wrapped in
 * Suspense because useSearchParams() requires it in Next.js App Router.
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 */

"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { SearchInput } from "@/components/common/SearchInput";
import { CatalogFilters } from "@/components/features/catalog/CatalogFilters";
import { SpeciesGrid } from "@/components/features/catalog/SpeciesGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpeciesCatalog } from "@/hooks/features/catalog/useSpeciesCatalog";
import { Suspense } from "react";

/* ─── Fallback while searchParams resolve ───────────────────────────────── */

function CatalogSkeleton() {
    return (
        <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-full max-w-2xl" />
            <div className="flex gap-3">
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-10 w-44" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-3/4 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

/* ─── Inner component (uses useSearchParams via the hook) ───────────────── */

function CatalogContent() {
    const catalog = useSpeciesCatalog();

    return (
        <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {/* ── Header ─────────────────────────────────────────────── */}
            <PageHeader
                title="Catálogo de Biodiversidad"
                description="Explora la biodiversidad del departamento de Caldas, Colombia. Busca especies por nombre, reino, familia o municipio."
                breadcrumbs={[
                    { label: "Inicio", href: "/" },
                    { label: "Catálogo" },
                ]}
            />

            {/* ── Search ─────────────────────────────────────────────── */}
            <section className="mb-6" aria-label="Búsqueda de especies">
                <SearchInput
                    placeholder="Buscar por nombre científico, común, familia o género..."
                    value={catalog.searchParams.query ?? ""}
                    onChange={catalog.setSearch}
                    aria-label="Buscar especies en el catálogo"
                    className="max-w-2xl"
                />
            </section>

            {/* ── Filters ────────────────────────────────────────────── */}
            <CatalogFilters
                searchParams={catalog.searchParams}
                filterOptions={catalog.filterOptions}
                activeFilterCount={catalog.activeFilterCount}
                hasActiveFilters={catalog.hasActiveFilters}
                currentSort={catalog.currentSort}
                totalCount={catalog.totalCount}
                onFilterChange={catalog.setFilter}
                onSortChange={catalog.setSort}
                onClearFilters={catalog.clearFilters}
                className="mb-6"
            />

            {/* ── Grid / List ────────────────────────────────────────── */}
            <SpeciesGrid
                species={catalog.species}
                viewMode={catalog.viewMode}
                onViewModeChange={catalog.setViewMode}
                isLoading={catalog.isLoading}
                isFetching={catalog.isFetching}
                isError={catalog.isError}
                isEmpty={catalog.isEmpty}
                hasActiveFilters={catalog.hasActiveFilters}
                onRetry={catalog.refetch}
                onClearFilters={catalog.clearFilters}
            />

            {/* ── Pagination ─────────────────────────────────────────── */}
            {!catalog.isLoading && !catalog.isError && (
                <Pagination
                    currentPage={catalog.currentPage}
                    totalPages={catalog.totalPages}
                    onPageChange={catalog.setPage}
                    className="mt-8"
                />
            )}
        </main>
    );
}

/* ─── Page (wrapped in Suspense for useSearchParams) ────────────────────── */

export default function CatalogPage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <CatalogContent />
        </Suspense>
    );
}
