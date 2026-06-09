/**
 * React Query hooks for Species — Biodiversity Catalog.
 *
 * Connected to the .NET backend — no mock fallbacks.
 *
 * @module hooks/useSpecies
 */

import {
    getCachedImages,
    getCachedList,
    getCachedSpecies,
} from "@/lib/db/species-cache";
import { handleApiError } from "@/lib/error-handler";
import * as speciesService from "@/services/species-service";
import type {
    PaginatedResponse,
    SpeciesFilterMeta,
    SpeciesImage,
    SpeciesListItem,
    SpeciesSearchParams,
} from "@/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

const SPECIES_KEYS = {
    all: ["species"] as const,
    lists: () => [...SPECIES_KEYS.all, "list"] as const,
    list: (params: SpeciesSearchParams) =>
        [...SPECIES_KEYS.lists(), params] as const,
    filterMeta: () => [...SPECIES_KEYS.all, "filter-meta"] as const,
    details: () => [...SPECIES_KEYS.all, "detail"] as const,
    detail: (id: string) => [...SPECIES_KEYS.details(), id] as const,
};

export const SPECIES_FILTER_META_QUERY_KEY = [
    "species",
    "filter-meta",
] as const;

/**
 * Fetch species from backend with server-side filtering/pagination.
 */
export function useSpeciesList(params: SpeciesSearchParams = {}) {
    return useQuery({
        queryKey: SPECIES_KEYS.list(params),
        queryFn: async (): Promise<PaginatedResponse<SpeciesListItem>> => {
            try {
                return await speciesService.getList(params);
            } catch (error) {
                // Offline fallback: serve from the local cache if populated.
                const cached = await getCachedList(params);
                if (cached.items.length > 0) {
                    return cached;
                }
                handleApiError(error);
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

/** Fetch backend species filter metadata (kingdoms/families/etc). */
export function useSpeciesFilterMeta() {
    return useQuery({
        queryKey: SPECIES_FILTER_META_QUERY_KEY,
        queryFn: async (): Promise<SpeciesFilterMeta> => {
            try {
                return await speciesService.getFilterMeta();
            } catch (error) {
                handleApiError(error);
                return {
                    kingdoms: [],
                    phylums: [],
                    classes: [],
                    orders: [],
                    families: [],
                    genera: [],
                    conservationStatuses: [],
                    totalSpeciesCount: 0,
                };
            }
        },
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
    });
}

/**
 * Fetch a single species by ID (full detail).
 */
export function useSpeciesDetail(id: string) {
    return useQuery({
        queryKey: SPECIES_KEYS.detail(id),
        queryFn: async () => {
            try {
                return await speciesService.getById(id);
            } catch (error) {
                // Offline fallback: return cached detail if previously viewed.
                const cached = await getCachedSpecies(id);
                if (cached) return cached;
                throw error;
            }
        },
        enabled: !!id,
    });
}

const GALLERY_PAGE_SIZE = 20;

/**
 * Fetch a species' geographic distribution points.
 * Coordinates may be masked server-side for sensitive species.
 */
export function useSpeciesDistributions(id: string) {
    return useQuery({
        queryKey: [...SPECIES_KEYS.detail(id), "distributions"] as const,
        queryFn: () => speciesService.getSpeciesDistributions(id),
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Infinite-scroll species image gallery.
 *
 * @param id            Species id.
 * @param onlyValidated When true (default), only expert-validated images load.
 */
export function useSpeciesGallery(id: string, onlyValidated = true) {
    return useInfiniteQuery({
        queryKey: [
            ...SPECIES_KEYS.detail(id),
            "images",
            { onlyValidated },
        ] as const,
        queryFn: async ({ pageParam }) => {
            try {
                return await speciesService.getSpeciesImages(id, {
                    onlyValidatedByExpert: onlyValidated,
                    page: pageParam,
                    pageSize: GALLERY_PAGE_SIZE,
                });
            } catch (error) {
                // Offline fallback: serve cached first page (single batch).
                if (pageParam === 1) {
                    const cachedItems = await getCachedImages(id);
                    const filtered = onlyValidated
                        ? cachedItems.filter((i) => i.isValidatedByExpert)
                        : cachedItems;
                    if (filtered.length > 0) {
                        return {
                            items: filtered,
                            totalCount: filtered.length,
                            page: 1,
                            pageSize: filtered.length,
                            totalPages: 1,
                            hasNextPage: false,
                            hasPreviousPage: false,
                        } satisfies PaginatedResponse<SpeciesImage>;
                    }
                }
                throw error;
            }
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: PaginatedResponse<SpeciesImage>) =>
            lastPage.hasNextPage ? lastPage.page + 1 : undefined,
        enabled: !!id,
        staleTime: 30 * 60 * 1000,
    });
}
