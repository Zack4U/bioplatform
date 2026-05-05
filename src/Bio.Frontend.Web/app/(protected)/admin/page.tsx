"use client";

/**
 * Admin dashboard page — renders role-appropriate dashboard.
 */

import { LoadingSpinner } from "@/components/common";
import { AdminDashboardView } from "@/components/features/admin/dashboard/AdminDashboardView";
import { AuthorityDashboardView } from "@/components/features/admin/dashboard/AuthorityDashboardView";
import { EntrepreneurDashboardView } from "@/components/features/admin/dashboard/EntrepreneurDashboardView";
import { ResearcherDashboardView } from "@/components/features/admin/dashboard/ResearcherDashboardView";
import { useAdminDashboard } from "@/hooks/features/admin/useAdminDashboard";

export default function AdminDashboardPage() {
    const {
        role, isLoading, adminMetrics, researcherMetrics,
        entrepreneurMetrics, authorityMetrics, revenueChart, recentActivity,
    } = useAdminDashboard();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    switch (role) {
        case "ADMIN":
            return adminMetrics ? (
                <AdminDashboardView
                    metrics={adminMetrics}
                    revenueChart={revenueChart}
                    recentActivity={recentActivity}
                />
            ) : null;

        case "RESEARCHER":
            return researcherMetrics ? (
                <ResearcherDashboardView
                    metrics={researcherMetrics}
                    recentActivity={recentActivity}
                />
            ) : null;

        case "ENTREPRENEUR":
            return entrepreneurMetrics ? (
                <EntrepreneurDashboardView
                    metrics={entrepreneurMetrics}
                    revenueChart={revenueChart}
                />
            ) : null;

        case "AUTHORITY":
            return authorityMetrics ? (
                <AuthorityDashboardView metrics={authorityMetrics} />
            ) : null;

        default:
            return null;
    }
}
