"use client";
/**
 * useAuditLogManagement — Activity Logs admin via React Query.
 */
import { useQuery } from "@tanstack/react-query";
import { getAuditLogById, getAuditLogs } from "@/services/admin-service";
import type { AuditLogFilters } from "@/types/admin";

export function useAuditLogs(filters: AuditLogFilters = {}) {
    return useQuery({
        queryKey: ["admin", "audit", filters],
        queryFn: () => getAuditLogs(filters),
        staleTime: 1000 * 60 * 5,
    });
}

export function useAuditLogById(id: string | null) {
    return useQuery({
        queryKey: ["admin", "audit", id],
        queryFn: () => getAuditLogById(id!),
        enabled: !!id,
    });
}
