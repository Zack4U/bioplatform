"use client";
/**
 * useRequestsManagement — Platform requests (solicitudes) via React Query.
 */
import { useQuery } from "@tanstack/react-query";
import { getPlatformRequests } from "@/services/admin-service";
import type { PlatformRequestFilters } from "@/types/admin";

export function useRequestsList(filters: PlatformRequestFilters = {}) {
    return useQuery({
        queryKey: ["admin", "requests", filters],
        queryFn: () => getPlatformRequests(filters),
        staleTime: 1000 * 60 * 2,
        refetchInterval: 1000 * 60 * 5, // auto-refresh every 5 min
    });
}
