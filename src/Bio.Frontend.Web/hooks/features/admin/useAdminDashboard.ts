"use client";

/**
 * useAdminDashboard — role-specific dashboard metrics via React Query.
 * Connects to the real backend dashboard endpoints.
 *
 * @module hooks/features/admin/useAdminDashboard
 */

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import {
    getAdminDashboard,
    getResearcherDashboard,
    getSellerDashboard,
    getAuthorityDashboard,
} from "@/services/admin-service";
import type {
    AdminDashboardDTO,
    AuthorityDashboardDTO,
    ResearcherDashboardDTO,
    SellerDashboardEnhancedDTO,
} from "@/types/admin";

type DashboardRole = "ADMIN" | "RESEARCHER" | "ENTREPRENEUR" | "AUTHORITY" | "BUYER";

function resolveRole(roles: string[]): DashboardRole {
    if (roles.includes("ADMIN"))         return "ADMIN";
    if (roles.includes("RESEARCHER"))    return "RESEARCHER";
    if (roles.includes("ENTREPRENEUR"))  return "ENTREPRENEUR";
    if (roles.includes("AUTHORITY") || roles.includes("ENVIRONMENTAL_AUTHORITY")) return "AUTHORITY";
    return "BUYER";
}

// ── ADMIN ────────────────────────────────────────────────────────────────────

export function useAdminDashboardMetrics(enabled = true) {
    return useQuery<AdminDashboardDTO>({
        queryKey: ["dashboard", "admin"],
        queryFn: getAdminDashboard,
        staleTime: 1000 * 60 * 5,
        enabled,
    });
}

// ── RESEARCHER ───────────────────────────────────────────────────────────────

export function useResearcherDashboard(enabled = true) {
    return useQuery<ResearcherDashboardDTO>({
        queryKey: ["dashboard", "researcher"],
        queryFn: getResearcherDashboard,
        staleTime: 1000 * 60 * 5,
        enabled,
    });
}

// ── ENTREPRENEUR / SELLER ────────────────────────────────────────────────────

export function useSellerDashboard(entrepreneurId?: string, enabled = true) {
    return useQuery<SellerDashboardEnhancedDTO>({
        queryKey: ["dashboard", "seller", entrepreneurId],
        queryFn: () => getSellerDashboard(entrepreneurId),
        staleTime: 1000 * 60 * 5,
        enabled,
    });
}

// ── AUTHORITY ────────────────────────────────────────────────────────────────

export function useAuthorityDashboard(expiryAlertDays = 90, enabled = true) {
    return useQuery<AuthorityDashboardDTO>({
        queryKey: ["dashboard", "authority", expiryAlertDays],
        queryFn: () => getAuthorityDashboard(expiryAlertDays),
        staleTime: 1000 * 60 * 5,
        enabled,
    });
}

// ── Composite hook — resolves role and fetches correct dashboard ──────────────

export function useAdminDashboard() {
    const { user } = useAuthStore();
    const roles = user?.roles ?? [];
    const role = resolveRole(roles);

    const isAdmin        = role === "ADMIN";
    const isResearcher   = role === "RESEARCHER";
    const isEntrepreneur = role === "ENTREPRENEUR";
    const isAuthority    = role === "AUTHORITY";

    const adminQuery      = useAdminDashboardMetrics(isAdmin);
    const researcherQuery = useResearcherDashboard(isResearcher);
    const sellerQuery     = useSellerDashboard(user?.id, isEntrepreneur);
    const authorityQuery  = useAuthorityDashboard(90, isAuthority);

    const isLoading =
        (isAdmin        && adminQuery.isLoading)      ||
        (isResearcher   && researcherQuery.isLoading) ||
        (isEntrepreneur && sellerQuery.isLoading)     ||
        (isAuthority    && authorityQuery.isLoading);

    const error =
        (isAdmin        && adminQuery.error)      ||
        (isResearcher   && researcherQuery.error) ||
        (isEntrepreneur && sellerQuery.error)     ||
        (isAuthority    && authorityQuery.error)  ||
        null;

    return {
        role,
        isLoading,
        error,
        adminMetrics:      isAdmin        ? adminQuery.data      : null,
        researcherMetrics: isResearcher   ? researcherQuery.data : null,
        sellerMetrics:     isEntrepreneur ? sellerQuery.data     : null,
        authorityMetrics:  isAuthority    ? authorityQuery.data  : null,
        refetch: () => {
            if (isAdmin)        adminQuery.refetch();
            if (isResearcher)   researcherQuery.refetch();
            if (isEntrepreneur) sellerQuery.refetch();
            if (isAuthority)    authorityQuery.refetch();
        },
    };
}
