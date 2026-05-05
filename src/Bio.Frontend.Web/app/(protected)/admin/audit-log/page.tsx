import { AuditLogManagement } from "@/components/features/admin/audit-log/AuditLogManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Registro de Auditoria" };

export default function AuditLogPage() {
    return <AuditLogManagement />;
}
