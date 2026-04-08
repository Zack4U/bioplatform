/**
 * useProductCatalog — custom hook for the Marketplace product listing.
 *
 * Mirrors the useSpeciesCatalog pattern: URL-synced filters, sort, pagination,
 * React Query data fetching, and view mode toggling.
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *  - This hook → ALL logic
 *  - ProductGrid / ProductFilters / page.tsx → UI ONLY
 *
 * Connected to: marketplace-service.getProducts() (mock, future backend)
 *
 * @module hooks/features/marketplace/useProductCatalog
 */

"use client";

import { MARKETPLACE_DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { getCategories, getProducts } from "@/services/marketplace-service";
import type { PaginatedResponse, ProductCategory, ProductListItem, ProductSearchParams } from "@/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

/* ─── View mode ─────────────────────────────────────────────────────────── */

export type ViewMode = "grid" | "list";

/* ─── Sort options ──────────────────────────────────────────────────────── */

export interface SortOption {
    label: string;
    value: string;
    sortBy: ProductSearchParams["sortBy"];
    sortOrder: ProductSearchParams["sortOrder"];
}

export const SORT_OPTIONS: SortOption[] = [
    {
        label: "Nombre (A-Z)",
        value: "name-asc",
        sortBy: "name",
        sortOrder: "asc",
    },
    {
        label: "Nombre (Z-A)",
        value: "name-desc",
        sortBy: "name",
        sortOrder: "desc",
    },
    {
        label: "Precio: menor a mayor",
        value: "price-asc",
        sortBy: "price",
        sortOrder: "asc",
    },
    {
        label: "Precio: mayor a menor",
        value: "price-desc",
        sortBy: "price",
        sortOrder: "desc",
    },
    {
        label: "Mejor valorados",
        value: "rating-desc",
        sortBy: "rating",
        sortOrder: "desc",
    },
    {
        label: "Más recientes",
        value: "createdAt-desc",
        sortBy: "createdAt",
        sortOrder: "desc",
    },
];

/* ─── URL ↔ ProductSearchParams ─────────────────────────────────────────── */

const PARAM_MAP = {
    query: "q",
    categoryId: "categoria",
    minPrice: "precioMin",
    maxPrice: "precioMax",
    minRating: "valoracion",
    page: "pagina",
    sortBy: "ordenar",
    sortOrder: "dir",
} as const;

function urlToSearchParams(urlParams: URLSearchParams): ProductSearchParams {
    const params: ProductSearchParams = {
        pageSize: MARKETPLACE_DEFAULT_PAGE_SIZE,
    };

    const q = urlParams.get(PARAM_MAP.query);
    if (q) params.query = q;

    const catId = urlParams.get(PARAM_MAP.categoryId);
    if (catId) params.categoryId = parseInt(catId, 10) || undefined;

    const minPrice = urlParams.get(PARAM_MAP.minPrice);
    if (minPrice) params.minPrice = parseInt(minPrice, 10);

    const maxPrice = urlParams.get(PARAM_MAP.maxPrice);
    if (maxPrice) params.maxPrice = parseInt(maxPrice, 10);

    const minRating = urlParams.get(PARAM_MAP.minRating);
    if (minRating) params.minRating = parseFloat(minRating);

    const page = urlParams.get(PARAM_MAP.page);
    params.page = page ? Math.max(1, parseInt(page, 10) || 1) : 1;

    const sortBy = urlParams.get(PARAM_MAP.sortBy);
    if (
        sortBy === "name" ||
        sortBy === "price" ||
        sortBy === "rating" ||
        sortBy === "createdAt"
    ) {
        params.sortBy = sortBy;
    } else {
        params.sortBy = "name";
    }

    const sortOrder = urlParams.get(PARAM_MAP.sortOrder);
    if (sortOrder === "asc" || sortOrder === "desc") {
        params.sortOrder = sortOrder;
    } else {
        params.sortOrder = "asc";
    }

    return params;
}

function searchParamsToUrl(
    params: ProductSearchParams,
    vista?: ViewMode,
): string {
    const urlParams = new URLSearchParams();

    if (params.query) urlParams.set(PARAM_MAP.query, params.query);
    if (params.categoryId)
        urlParams.set(PARAM_MAP.categoryId, String(params.categoryId));
    if (params.minPrice !== undefined)
        urlParams.set(PARAM_MAP.minPrice, String(params.minPrice));
    if (params.maxPrice !== undefined)
        urlParams.set(PARAM_MAP.maxPrice, String(params.maxPrice));
    if (params.minRating !== undefined)
        urlParams.set(PARAM_MAP.minRating, String(params.minRating));
    if (params.page && params.page > 1)
        urlParams.set(PARAM_MAP.page, String(params.page));
    if (params.sortBy && params.sortBy !== "name")
        urlParams.set(PARAM_MAP.sortBy, params.sortBy);
    if (params.sortOrder && params.sortOrder !== "asc")
        urlParams.set(PARAM_MAP.sortOrder, params.sortOrder);
    if (vista && vista !== "grid") urlParams.set("vista", vista);

    const qs = urlParams.toString();
    return qs ? `?${qs}` : "";
}

/* ─── Hook ──────────────────────────────────────────────────────────────── */

export function useProductCatalog() {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    /* ── Derive state from URL ──────────────────────────────────────── */

    const searchParams = useMemo(
        () => urlToSearchParams(urlSearchParams),
        [urlSearchParams],
    );

    const viewMode: ViewMode =
        (urlSearchParams.get("vista") as ViewMode) || "grid";

    /* ── Push state to URL ──────────────────────────────────────────── */

    const pushParams = useCallback(
        (newParams: ProductSearchParams, newViewMode?: ViewMode) => {
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

    /* ── React Query — categories ───────────────────────────────────── */

    const { data: categories = [] } = useQuery<ProductCategory[]>({
        queryKey: ["marketplace", "categories"],
        queryFn: getCategories,
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });

    /* ── React Query — product list ─────────────────────────────────── */

    const queryKey = ["marketplace", "products", searchParams] as const;

    const { data, isLoading, isFetching, isError, error, refetch } = useQuery<
        PaginatedResponse<ProductListItem>
    >({
        queryKey,
        queryFn: () => getProducts(searchParams),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        placeholderData: keepPreviousData,
        retry: 2,
    });

    /* ── Derived state ───────────────────────────────────────────────── */

    const products = data?.items ?? [];
    const totalCount = data?.totalCount ?? 0;
    const currentPage = data?.page ?? 1;
    const totalPages = data?.totalPages ?? 1;
    const hasNextPage = data?.hasNextPage ?? false;
    const hasPreviousPage = data?.hasPreviousPage ?? false;
    const isEmpty = !isLoading && products.length === 0;

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchParams.categoryId) count++;
        if (searchParams.minPrice !== undefined) count++;
        if (searchParams.maxPrice !== undefined) count++;
        if (searchParams.minRating !== undefined) count++;
        return count;
    }, [searchParams]);

    const hasActiveFilters = activeFilterCount > 0 || !!searchParams.query;

    /* ── Actions ─────────────────────────────────────────────────────── */

    const setSearch = useCallback(
        (query: string) => {
            pushParams({ ...searchParams, query: query || undefined, page: 1 });
        },
        [searchParams, pushParams],
    );

    const setFilter = useCallback(
        <K extends keyof ProductSearchParams>(
            key: K,
            value: ProductSearchParams[K],
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
            pageSize: MARKETPLACE_DEFAULT_PAGE_SIZE,
            sortBy: "name",
            sortOrder: "asc",
        });
    }, [pushParams]);

    const currentSort = `${searchParams.sortBy ?? "name"}-${searchParams.sortOrder ?? "asc"}`;

    /* ── Public API ──────────────────────────────────────────────────── */

    return {
        // Data
        products,
        totalCount,
        currentPage,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        isEmpty,
        categories,

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
