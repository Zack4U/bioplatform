/**
 * useSpeciesDetail — React Query hook for the species detail page.
 *
 * Fetches full species detail by slug from GET /api/species/slug/{slug}.
 * Returns SpeciesDetail including taxonomy, distributions, and related products.
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *
 * @module hooks/features/catalog/useSpeciesDetail
 */

"use client";

import { getSpeciesBySlug } from "@/services/species-service";
import type { SpeciesDetail } from "@/types/species";
import { useQuery } from "@tanstack/react-query";

export function useSpeciesDetail(slug: string) {
    const { data, isLoading, isError, error, refetch } = useQuery<SpeciesDetail>({
        queryKey: ["species", "detail", slug],
        queryFn: () => getSpeciesBySlug(slug),
        enabled: !!slug,
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        retry: 2,
    });

    return {
        species: data ?? null,
        isLoading,
        isError,
        error,
        refetch,
    };
}
