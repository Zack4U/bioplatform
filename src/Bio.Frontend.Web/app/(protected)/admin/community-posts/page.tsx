import { CommunityPostsManagement } from "@/components/features/admin/community-posts/CommunityPostsManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion de Posts" };

export default function AdminCommunityPostsPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "COMMUNITY", "RESEARCHER", "ENTREPRENEUR", "AUTHORITY", "BUYER"]}>
            <CommunityPostsManagement />
        </PageRoleGuard>
    );
}
