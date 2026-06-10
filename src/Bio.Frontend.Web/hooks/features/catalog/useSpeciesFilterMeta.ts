/**
 * useSpeciesFilterMeta — React Query hook for species filter metadata.
 *
 * Fetches distinct filter values from GET /api/species/filter-meta.
 * Cached with a long staleTime since filter options change infrequently.
 *
 * Returns data formatted as SelectOption[] for direct use in dropdowns.
 *
 * @module hooks/features/catalog/useSpeciesFilterMeta
 */

"use client";

import { formatConservationStatus } from "@/lib/formatters";
import { getSpeciesFilterMeta } from "@/services/species-service";
import type { SpeciesFilterMeta } from "@/types/species";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export interface FilterSelectOption {
    label: string;
    value: string;
}

export function useSpeciesFilterMeta() {
    const { data, isLoading, isError, error } = useQuery<SpeciesFilterMeta>({
        queryKey: ["species", "filter-meta"],
        queryFn: getSpeciesFilterMeta,
        staleTime: 30 * 60 * 1000, // 30 minutes — filter options rarely change
        gcTime: 60 * 60 * 1000, // 1 hour
        retry: 2,
    });

    const filterOptions = useMemo(() => {
        const toOptions = (values?: string[]): FilterSelectOption[] =>
            values?.map((v) => ({ label: v, value: v })) ?? [];

        return {
            kingdoms: toOptions(data?.kingdoms),
            phylums: toOptions(data?.phylums),
            classes: toOptions(data?.classes),
            orders: toOptions(data?.orders),
            families: toOptions(data?.families),
            genera: toOptions(data?.genera),
            conservationStatuses:
                data?.conservationStatuses?.map((v) => ({
                    label: formatConservationStatus(v),
                    value: v,
                })) ?? [],
        };
    }, [data]);

    return {
        filterOptions,
        totalSpeciesCount: data?.totalSpeciesCount ?? 0,
        isLoading,
        isError,
        error,
    };
}
