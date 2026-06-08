import { PermitsManagement } from "@/components/features/admin/permits/PermitsManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Permisos ABS" };

export default function PermitsPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "AUTHORITY", "ENTREPRENEUR"]}>
            <PermitsManagement />
        </PageRoleGuard>
    );
}
