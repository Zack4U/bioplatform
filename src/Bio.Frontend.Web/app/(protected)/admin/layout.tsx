/**
 * Admin layout — wraps all /admin/* pages.
 * Provides sidebar + header shell. Hides public Navbar/Footer.
 * Protected by AuthGuard with ADMIN_ROLES.
 */

import { AuthGuard } from "@/components/common/AuthGuard";
import { AdminHeader } from "@/components/features/admin/layout/AdminHeader";
import { AdminSidebar } from "@/components/features/admin/layout/AdminSidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Panel de Administracion",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard
            requiredRoles={[
                "ADMIN",
                "RESEARCHER",
                "ENTREPRENEUR",
                "AUTHORITY",
                "COMMUNITY",
            ]}
        >
            <TooltipProvider>
                <div className="flex h-screen overflow-hidden bg-background">
                    <AdminSidebar />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <AdminHeader />
                        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                            {children}
                        </main>
                    </div>
                </div>
            </TooltipProvider>
        </AuthGuard>
    );
}
