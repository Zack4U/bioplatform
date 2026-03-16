/**
 * React Query hooks for Species — Biodiversity Catalog.
 *
 * Ready for real backend integration: when the API is available,
 * remove the mock fallback in each queryFn and the data flows seamlessly
 * through the same hook interface.
 *
 * @module hooks/useSpecies
 */

import { MOCK_SPECIES, MOCK_SPECIES_DETAIL } from "@/lib/mock-data";
import { apiGet, apiGetPaginated } from "@/services/api";
import type {
    PaginatedResponse,
    Species,
    SpeciesListItem,
    SpeciesSearchParams,
} from "@/types";
import { useQuery } from "@tanstack/react-query";

const SPECIES_KEYS = {
    all: ["species"] as const,
    lists: () => [...SPECIES_KEYS.all, "list"] as const,
    list: (params: SpeciesSearchParams) =>
        [...SPECIES_KEYS.lists(), params] as const,
    details: () => [...SPECIES_KEYS.all, "detail"] as const,
    detail: (id: string) => [...SPECIES_KEYS.details(), id] as const,
};

/**
 * Fetch paginated list of species with search/filter support.
 * Falls back to mock data when the backend is unreachable.
 */
export function useSpeciesList(params: SpeciesSearchParams = {}) {
    return useQuery({
        queryKey: SPECIES_KEYS.list(params),
        queryFn: async (): Promise<PaginatedResponse<SpeciesListItem>> => {
            try {
                return await apiGetPaginated<SpeciesListItem>(
                    "/species",
                    params as Record<string, unknown>,
                );
            } catch {
                // Mock fallback — filter locally
                let filtered = [...MOCK_SPECIES];
                if (params.query) {
                    const q = params.query.toLowerCase();
                    filtered = filtered.filter(
                        (s) =>
                            s.scientificName.toLowerCase().includes(q) ||
                            s.commonName?.toLowerCase().includes(q) ||
                            s.family?.toLowerCase().includes(q),
                    );
                }
                if (params.kingdom) {
                    filtered = filtered.filter(
                        (s) => s.kingdom === params.kingdom,
                    );
                }
                return {
                    items: filtered,
                    totalCount: filtered.length,
                    page: params.page ?? 1,
                    pageSize: params.pageSize ?? 12,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                };
            }
        },
        staleTime: 5 * 60 * 1000, // 5 min
    });
}

/**
 * Fetch a single species by ID (full detail).
 * Falls back to mock detail data when the backend is unreachable.
 */
export function useSpeciesDetail(id: string) {
    return useQuery({
        queryKey: SPECIES_KEYS.detail(id),
        queryFn: async (): Promise<Species> => {
            try {
                return await apiGet<Species>(`/species/${id}`);
            } catch {
                // Mock fallback
                return {
                    ...MOCK_SPECIES_DETAIL,
                    id,
                };
            }
        },
        enabled: !!id,
    });
}
