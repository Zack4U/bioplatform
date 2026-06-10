import { UsersManagement } from "@/components/features/admin/users/UsersManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Usuarios" };

export default function UsersPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN"]}>
            <UsersManagement />
        </PageRoleGuard>
    );
}
