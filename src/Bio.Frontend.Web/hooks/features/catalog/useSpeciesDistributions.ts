/**
 * useSpeciesDistributions — React Query hook for geographic distributions.
 *
 * Fetches distribution points from GET /api/species/{id}/distributions.
 * Coordinates are masked for sensitive species if user lacks privileged role.
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *
 * @module hooks/features/catalog/useSpeciesDistributions
 */

"use client";

import { getSpeciesDistributions } from "@/services/species-service";
import type { GeographicDistribution } from "@/types/species";
import { useQuery } from "@tanstack/react-query";

export function useSpeciesDistributions(speciesId: string | undefined) {
    const { data, isLoading, isError, error, refetch } = useQuery<
        GeographicDistribution[]
    >({
        queryKey: ["species", "distributions", speciesId],
        queryFn: () => getSpeciesDistributions(speciesId!),
        enabled: !!speciesId,
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        retry: 1,
    });

    const distributions = data ?? [];
    const hasMaskedPoints = distributions.some((d) => d.isMasked);
    const hasVisiblePoints = distributions.some(
        (d) => d.latitude != null && d.longitude != null,
    );

    return {
        distributions,
        hasMaskedPoints,
        hasVisiblePoints,
        isLoading,
        isError,
        error,
        refetch,
    };
}
