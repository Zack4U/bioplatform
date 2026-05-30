import { CommunityCommentsManagement } from "@/components/features/admin/community-comments/CommunityCommentsManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion de Comentarios" };

export default function AdminCommunityCommentsPage() {
    return <CommunityCommentsManagement />;
}
