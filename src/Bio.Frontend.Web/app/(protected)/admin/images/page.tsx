import { ImagesManagement } from "@/components/features/admin/images/ImagesManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Imagenes" };

export default function ImagesPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "RESEARCHER", "AUTHORITY"]}>
            <ImagesManagement />
        </PageRoleGuard>
    );
}
