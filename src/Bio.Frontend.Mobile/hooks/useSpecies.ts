/**
 * React Query hooks for Species — Biodiversity Catalog.
 *
 * Connected to the .NET backend — no mock fallbacks.
 *
 * @module hooks/useSpecies
 */

import { handleApiError } from "@/lib/error-handler";
import * as speciesService from "@/services/species-service";
import type { SpeciesResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

const SPECIES_KEYS = {
    all: ["species"] as const,
    lists: () => [...SPECIES_KEYS.all, "list"] as const,
    list: (search?: string, kingdom?: string) =>
        [...SPECIES_KEYS.lists(), { search, kingdom }] as const,
    details: () => [...SPECIES_KEYS.all, "detail"] as const,
    detail: (id: string) => [...SPECIES_KEYS.details(), id] as const,
};

interface UseSpeciesListParams {
    query?: string;
    kingdom?: string;
}

/**
 * Fetch all species from the backend with client-side filtering.
 * Backend doesn't support search/filter params — we filter locally.
 */
export function useSpeciesList(params: UseSpeciesListParams = {}) {
    return useQuery({
        queryKey: SPECIES_KEYS.list(params.query, params.kingdom),
        queryFn: async (): Promise<SpeciesResponse[]> => {
            try {
                const allSpecies = await speciesService.getAll();

                let filtered = allSpecies;

                // Client-side search filter
                if (params.query) {
                    const q = params.query.toLowerCase();
                    filtered = filtered.filter(
                        (s) =>
                            s.scientificName.toLowerCase().includes(q) ||
                            s.commonName?.toLowerCase().includes(q) ||
                            s.taxonomy?.family?.toLowerCase().includes(q) ||
                            s.taxonomy?.genus?.toLowerCase().includes(q),
                    );
                }

                // Client-side kingdom filter
                if (params.kingdom) {
                    filtered = filtered.filter(
                        (s) => s.taxonomy?.kingdom === params.kingdom,
                    );
                }

                return filtered;
            } catch (error) {
                handleApiError(error);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000,
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
