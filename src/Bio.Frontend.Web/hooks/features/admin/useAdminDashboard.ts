"use client";

/**
 * useAdminDashboard — provides role-specific dashboard metrics.
 * TODO: Replace mock data with API calls via React Query.
 *
 * @module hooks/features/admin/useAdminDashboard
 */

import {
    mockAdminMetrics, mockAuthorityMetrics, mockEntrepreneurMetrics,
    mockRecentActivity, mockResearcherMetrics, mockRevenueChart,
} from "@/lib/admin-mock";
import { useAuthStore } from "@/store/auth-store";
import type {
    AdminPlatformMetrics, AuthorityMetrics, EntrepreneurMetrics,
    RecentActivityItem, ResearcherMetrics, RevenueChartPoint,
} from "@/types";
import { useEffect, useState } from "react";

type DashboardRole = "ADMIN" | "RESEARCHER" | "ENTREPRENEUR" | "AUTHORITY";

interface AdminDashboardState {
    role: DashboardRole;
    isLoading: boolean;
    adminMetrics: AdminPlatformMetrics | null;
    researcherMetrics: ResearcherMetrics | null;
    entrepreneurMetrics: EntrepreneurMetrics | null;
    authorityMetrics: AuthorityMetrics | null;
    revenueChart: RevenueChartPoint[];
    recentActivity: RecentActivityItem[];
}

export function useAdminDashboard(): AdminDashboardState {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [state, setState] = useState<Omit<AdminDashboardState, "isLoading" | "role">>({
        adminMetrics: null,
        researcherMetrics: null,
        entrepreneurMetrics: null,
        authorityMetrics: null,
        revenueChart: [],
        recentActivity: [],
    });

    const roles = user?.roles ?? [];
    const role: DashboardRole = roles.includes("ADMIN")
        ? "ADMIN"
        : roles.includes("RESEARCHER")
            ? "RESEARCHER"
            : roles.includes("ENTREPRENEUR")
                ? "ENTREPRENEUR"
                : "AUTHORITY";

    useEffect(() => {
        // TODO: Replace with React Query API call
        const timer = setTimeout(() => {
            switch (role) {
                case "ADMIN":
                    setState({
                        adminMetrics: mockAdminMetrics(),
                        researcherMetrics: null,
                        entrepreneurMetrics: null,
                        authorityMetrics: null,
                        revenueChart: mockRevenueChart(),
                        recentActivity: mockRecentActivity(),
                    });
                    break;
                case "RESEARCHER":
                    setState({
                        adminMetrics: null,
                        researcherMetrics: mockResearcherMetrics(),
                        entrepreneurMetrics: null,
                        authorityMetrics: null,
                        revenueChart: [],
                        recentActivity: mockRecentActivity().filter(
                            (a) => a.type === "species_added" || a.type === "image_validated",
                        ),
                    });
                    break;
                case "ENTREPRENEUR":
                    setState({
                        adminMetrics: null,
                        researcherMetrics: null,
                        entrepreneurMetrics: mockEntrepreneurMetrics(),
                        authorityMetrics: null,
                        revenueChart: mockRevenueChart(),
                        recentActivity: mockRecentActivity().filter(
                            (a) => a.type === "order_placed" || a.type === "review_posted",
                        ),
                    });
                    break;
                case "AUTHORITY":
                    setState({
                        adminMetrics: null,
                        researcherMetrics: null,
                        entrepreneurMetrics: null,
                        authorityMetrics: mockAuthorityMetrics(),
                        revenueChart: [],
                        recentActivity: mockRecentActivity().filter(
                            (a) => a.type === "permit_requested",
                        ),
                    });
                    break;
            }
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [role]);

    return { role, isLoading, ...state };
}
