/**
 * useSpeciesCatalog — custom hook for the Species Catalog feature.
 *
 * Encapsulates ALL state management, data fetching, filtering, search,
 * pagination, and cache logic. Components only consume returned values.
 *
 * URL Sync: All filter/search/sort/page state is synchronized with the URL
 * query string via useSearchParams. This enables:
 *   - Shareable/bookmarkable filtered views
 *   - Browser back/forward navigation through filter states
 *   - SEO-friendly filter URLs
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *  - This hook → ALL logic
 *  - CatalogFilters / SpeciesGrid / page.tsx → UI ONLY
 *
 * When the backend is ready, replace the mock import with apiGetPaginated.
 */

"use client";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
    fetchSpeciesList,
    MOCK_CONSERVATION_STATUSES,
    MOCK_FAMILIES,
    MOCK_GENERA,
    MOCK_KINGDOMS,
    MOCK_PHYLUMS,
} from "@/lib/mock-data/species";
import type { PaginatedResponse } from "@/types";
import type { SpeciesListItem, SpeciesSearchParams } from "@/types/species";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

/* ─── View mode ─────────────────────────────────────────────────────────── */

export type ViewMode = "grid" | "list";

/* ─── Sort option ───────────────────────────────────────────────────────── */

export interface SortOption {
    label: string;
    value: string;
    sortBy: SpeciesSearchParams["sortBy"];
    sortOrder: SpeciesSearchParams["sortOrder"];
}

export const SORT_OPTIONS: SortOption[] = [
    {
        label: "Nombre científico (A-Z)",
        value: "scientificName-asc",
        sortBy: "scientificName",
        sortOrder: "asc",
    },
    {
        label: "Nombre científico (Z-A)",
        value: "scientificName-desc",
        sortBy: "scientificName",
        sortOrder: "desc",
    },
    {
        label: "Nombre común (A-Z)",
        value: "commonName-asc",
        sortBy: "commonName",
        sortOrder: "asc",
    },
    {
        label: "Nombre común (Z-A)",
        value: "commonName-desc",
        sortBy: "commonName",
        sortOrder: "desc",
    },
    {
        label: "Más recientes",
        value: "createdAt-desc",
        sortBy: "createdAt",
        sortOrder: "desc",
    },
    {
        label: "Más antiguos",
        value: "createdAt-asc",
        sortBy: "createdAt",
        sortOrder: "asc",
    },
];

/* ─── Helpers: URL ↔ SpeciesSearchParams ────────────────────────────────── */

/** Mapping from SpeciesSearchParams keys to human-friendly Spanish URL params. */
const PARAM_MAP = {
    query: "q",
    kingdom: "reino",
    phylum: "filo",
    family: "familia",
    genus: "genero",
    isSensitive: "sensible",
    conservationStatus: "estado",
    page: "pagina",
    sortBy: "ordenar",
    sortOrder: "dir",
} as const;

/** Parse URL search parameters into SpeciesSearchParams. */
function urlToSearchParams(urlParams: URLSearchParams): SpeciesSearchParams {
    const params: SpeciesSearchParams = {
        pageSize: DEFAULT_PAGE_SIZE,
    };

    const q = urlParams.get(PARAM_MAP.query);
    if (q) params.query = q;

    const kingdom = urlParams.get(PARAM_MAP.kingdom);
    if (kingdom) params.kingdom = kingdom;

    const phylum = urlParams.get(PARAM_MAP.phylum);
    if (phylum) params.phylum = phylum;

    const family = urlParams.get(PARAM_MAP.family);
    if (family) params.family = family;

    const genus = urlParams.get(PARAM_MAP.genus);
    if (genus) params.genus = genus;

    const sensitive = urlParams.get(PARAM_MAP.isSensitive);
    if (sensitive === "true") params.isSensitive = true;
    else if (sensitive === "false") params.isSensitive = false;

    const conservationStatus = urlParams.get(PARAM_MAP.conservationStatus);
    if (conservationStatus) params.conservationStatus = conservationStatus;

    const page = urlParams.get(PARAM_MAP.page);
    params.page = page ? Math.max(1, parseInt(page, 10) || 1) : 1;

    const sortBy = urlParams.get(PARAM_MAP.sortBy);
    if (
        sortBy === "scientificName" ||
        sortBy === "commonName" ||
        sortBy === "createdAt"
    ) {
        params.sortBy = sortBy;
    } else {
        params.sortBy = "scientificName";
    }

    const sortOrder = urlParams.get(PARAM_MAP.sortOrder);
    if (sortOrder === "asc" || sortOrder === "desc") {
        params.sortOrder = sortOrder;
    } else {
        params.sortOrder = "asc";
    }

    return params;
}

/** Serialize SpeciesSearchParams to a URL query string (omits defaults). */
function searchParamsToUrl(
    params: SpeciesSearchParams,
    vista?: ViewMode,
): string {
    const urlParams = new URLSearchParams();

    if (params.query) urlParams.set(PARAM_MAP.query, params.query);
    if (params.kingdom) urlParams.set(PARAM_MAP.kingdom, params.kingdom);
    if (params.phylum) urlParams.set(PARAM_MAP.phylum, params.phylum);
    if (params.family) urlParams.set(PARAM_MAP.family, params.family);
    if (params.genus) urlParams.set(PARAM_MAP.genus, params.genus);
    if (params.isSensitive !== undefined)
        urlParams.set(PARAM_MAP.isSensitive, String(params.isSensitive));
    if (params.conservationStatus)
        urlParams.set(PARAM_MAP.conservationStatus, params.conservationStatus);
    if (params.page && params.page > 1)
        urlParams.set(PARAM_MAP.page, String(params.page));
    if (params.sortBy && params.sortBy !== "scientificName")
        urlParams.set(PARAM_MAP.sortBy, params.sortBy);
    if (params.sortOrder && params.sortOrder !== "asc")
        urlParams.set(PARAM_MAP.sortOrder, params.sortOrder);
    if (vista && vista !== "grid") urlParams.set("vista", vista);

    const qs = urlParams.toString();
    return qs ? `?${qs}` : "";
}

/* ─── Hook ──────────────────────────────────────────────────────────────── */

export function useSpeciesCatalog() {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    /* ── Derive state from URL (single source of truth) ──────────────────── */

    const searchParams = useMemo(
        () => urlToSearchParams(urlSearchParams),
        [urlSearchParams],
    );

    const viewMode: ViewMode =
        (urlSearchParams.get("vista") as ViewMode) || "grid";

    /* ── Push state to URL (updates trigger re-render → new searchParams) ── */

    const pushParams = useCallback(
        (newParams: SpeciesSearchParams, newViewMode?: ViewMode) => {
            startTransition(() => {
                const qs = searchParamsToUrl(
                    newParams,
                    newViewMode ?? viewMode,
                );
                router.push(`${pathname}${qs}`, { scroll: false });
            });
        },
        [router, pathname, viewMode, startTransition],
    );

    /* ── React Query — species list ──────────────────────────────────────── */

    const queryKey = ["species", "list", searchParams] as const;

    const { data, isLoading, isFetching, isError, error, refetch } = useQuery<
        PaginatedResponse<SpeciesListItem>
    >({
        queryKey,
        queryFn: () => fetchSpeciesList(searchParams),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        placeholderData: keepPreviousData,
        retry: 2,
    });

    /* ── Derived state ───────────────────────────────────────────────────── */

    const species = data?.items ?? [];
    const totalCount = data?.totalCount ?? 0;
    const currentPage = data?.page ?? 1;
    const totalPages = data?.totalPages ?? 1;
    const hasNextPage = data?.hasNextPage ?? false;
    const hasPreviousPage = data?.hasPreviousPage ?? false;
    const isEmpty = !isLoading && species.length === 0;

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchParams.kingdom) count++;
        if (searchParams.phylum) count++;
        if (searchParams.family) count++;
        if (searchParams.genus) count++;
        if (searchParams.isSensitive !== undefined) count++;
        if (searchParams.conservationStatus) count++;
        return count;
    }, [searchParams]);

    const hasActiveFilters = activeFilterCount > 0 || !!searchParams.query;

    /* ── Filter options (later from backend /meta endpoint) ──────────────── */

    const filterOptions = useMemo(
        () => ({
            kingdoms: MOCK_KINGDOMS.map((k) => ({ label: k, value: k })).sort(
                (a, b) => a.label.localeCompare(b.label, "es"),
            ),
            phylums: MOCK_PHYLUMS.map((p) => ({ label: p, value: p })).sort(
                (a, b) => a.label.localeCompare(b.label, "es"),
            ),
            families: MOCK_FAMILIES.map((f) => ({ label: f, value: f })).sort(
                (a, b) => a.label.localeCompare(b.label, "es"),
            ),
            genera: MOCK_GENERA.map((g) => ({ label: g, value: g })).sort(
                (a, b) => a.label.localeCompare(b.label, "es"),
            ),
            conservationStatuses: MOCK_CONSERVATION_STATUSES.map((s) => ({
                label: s,
                value: s,
            })).sort((a, b) => a.label.localeCompare(b.label, "es")),
        }),
        [],
    );

    /* ── Actions (all push to URL → re-derive state automatically) ───────── */

    const setSearch = useCallback(
        (query: string) => {
            pushParams({ ...searchParams, query: query || undefined, page: 1 });
        },
        [searchParams, pushParams],
    );

    const setFilter = useCallback(
        <K extends keyof SpeciesSearchParams>(
            key: K,
            value: SpeciesSearchParams[K],
        ) => {
            pushParams({ ...searchParams, [key]: value, page: 1 });
        },
        [searchParams, pushParams],
    );

    const setSort = useCallback(
        (sortValue: string) => {
            const option = SORT_OPTIONS.find((o) => o.value === sortValue);
            if (!option) return;
            pushParams({
                ...searchParams,
                sortBy: option.sortBy,
                sortOrder: option.sortOrder,
                page: 1,
            });
        },
        [searchParams, pushParams],
    );

    const setPage = useCallback(
        (page: number) => {
            pushParams({ ...searchParams, page });
        },
        [searchParams, pushParams],
    );

    const setViewMode = useCallback(
        (mode: ViewMode) => {
            pushParams(searchParams, mode);
        },
        [searchParams, pushParams],
    );

    const clearFilters = useCallback(() => {
        pushParams({
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
            sortBy: "scientificName",
            sortOrder: "asc",
        });
    }, [pushParams]);

    const currentSort = `${searchParams.sortBy ?? "scientificName"}-${searchParams.sortOrder ?? "asc"}`;

    /* ── Public API ──────────────────────────────────────────────────────── */

    return {
        // Data
        species,
        totalCount,
        currentPage,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        isEmpty,

        // Loading / Error
        isLoading,
        isFetching,
        isPending,
        isError,
        error,
        refetch,

        // Search & Filters
        searchParams,
        activeFilterCount,
        hasActiveFilters,
        filterOptions,
        setSearch,
        setFilter,
        clearFilters,

        // Sort
        currentSort,
        setSort,

        // Pagination
        setPage,

        // View mode
        viewMode,
        setViewMode,
    };
}
