/**
 * React Query hooks for Species — Biodiversity Catalog.
 *
 * Connected to the .NET backend — no mock fallbacks.
 *
 * @module hooks/useSpecies
 */

import { handleApiError } from "@/lib/error-handler";
import * as speciesService from "@/services/species-service";
import type {
    PaginatedResponse,
    SpeciesFilterMeta,
    SpeciesListItem,
    SpeciesSearchParams,
} from "@/types";
import { useQuery } from "@tanstack/react-query";

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
                handleApiError(error);
                return {
                    items: [],
                    totalCount: 0,
                    page: params.page ?? 1,
                    pageSize: params.pageSize ?? 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false,
                };
            }
        },
        staleTime: 5 * 60 * 1000,
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
        queryFn: () => speciesService.getById(id),
        enabled: !!id,
    });
}
