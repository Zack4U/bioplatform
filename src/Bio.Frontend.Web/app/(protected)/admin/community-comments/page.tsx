import { CommunityCommentsManagement } from "@/components/features/admin/community-comments/CommunityCommentsManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion de Comentarios" };

export default function AdminCommunityCommentsPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "COMMUNITY", "RESEARCHER", "ENTREPRENEUR", "AUTHORITY", "BUYER"]}>
            <CommunityCommentsManagement />
        </PageRoleGuard>
    );
}
