"use client";

/**
 * Admin dashboard page — renders role-appropriate dashboard via real API.
 */

import { LoadingSpinner } from "@/components/common";
import { AdminDashboardView } from "@/components/features/admin/dashboard/AdminDashboardView";
import { AuthorityDashboardView } from "@/components/features/admin/dashboard/AuthorityDashboardView";
import { EntrepreneurDashboardView } from "@/components/features/admin/dashboard/EntrepreneurDashboardView";
import { ResearcherDashboardView } from "@/components/features/admin/dashboard/ResearcherDashboardView";
import { useAdminDashboard } from "@/hooks/features/admin/useAdminDashboard";
import { AlertCircle } from "lucide-react";

export default function AdminDashboardPage() {
    const {
        role, isLoading, error,
        adminMetrics, researcherMetrics, sellerMetrics, authorityMetrics,
    } = useAdminDashboard();

    if (isLoading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-destructive">
                <AlertCircle className="h-10 w-10" />
                <p className="text-sm">Error al cargar el dashboard. Intenta recargar la página.</p>
            </div>
        );
    }

    switch (role) {
        case "ADMIN":
            return adminMetrics ? <AdminDashboardView metrics={adminMetrics} /> : null;

        case "RESEARCHER":
            return researcherMetrics ? <ResearcherDashboardView metrics={researcherMetrics} /> : null;

        case "ENTREPRENEUR":
            return sellerMetrics ? <EntrepreneurDashboardView metrics={sellerMetrics} /> : null;

        case "AUTHORITY":
            return authorityMetrics ? <AuthorityDashboardView metrics={authorityMetrics} /> : null;

        default:
            return (
                <div className="py-10 text-center text-muted-foreground">
                    Dashboard no disponible para tu rol actual.
                </div>
            );
    }
}
