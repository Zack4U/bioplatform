import { ConnectionsManagement } from "@/components/features/admin/connections/ConnectionsManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion de Conexiones" };

export default function AdminConnectionsPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN"]}>
            <ConnectionsManagement />
        </PageRoleGuard>
    );
}
