import { RequestsManagement } from "@/components/features/admin/requests/RequestsManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Solicitudes" };

export default function RequestsPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "AUTHORITY", "RESEARCHER", "ENTREPRENEUR"]}>
            <RequestsManagement />
        </PageRoleGuard>
    );
}
