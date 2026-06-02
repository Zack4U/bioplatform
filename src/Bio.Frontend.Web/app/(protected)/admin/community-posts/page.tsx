import { CommunityPostsManagement } from "@/components/features/admin/community-posts/CommunityPostsManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion de Posts" };

export default function AdminCommunityPostsPage() {
    return <CommunityPostsManagement />;
}
