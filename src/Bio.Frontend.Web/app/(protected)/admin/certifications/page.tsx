import { CertificationsManagement } from "@/components/features/admin/certifications/CertificationsManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion de Certificaciones" };

export default function AdminCertificationsPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "AUTHORITY", "ENTREPRENEUR"]}>
            <CertificationsManagement />
        </PageRoleGuard>
    );
}
