import { CnnModelManagement } from "@/components/features/admin/ai-model/CnnModelManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion del Modelo CNN" };

export default function AiModelPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "RESEARCHER"]}>
            <CnnModelManagement />
        </PageRoleGuard>
    );
}
