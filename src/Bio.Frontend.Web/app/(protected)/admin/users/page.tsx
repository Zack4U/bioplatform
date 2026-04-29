import { UsersManagement } from "@/components/features/admin/users/UsersManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Usuarios" };

export default function UsersPage() {
    return <UsersManagement />;
}
