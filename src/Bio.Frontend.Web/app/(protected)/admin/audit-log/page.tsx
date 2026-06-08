import { AuditLogManagement } from "@/components/features/admin/audit-log/AuditLogManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Registro de Auditoria" };

export default function AuditLogPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN"]}>
            <AuditLogManagement />
        </PageRoleGuard>
    );
}
