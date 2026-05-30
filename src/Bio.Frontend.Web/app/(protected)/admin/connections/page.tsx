import { ConnectionsManagement } from "@/components/features/admin/connections/ConnectionsManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion de Conexiones" };

export default function AdminConnectionsPage() {
    return <ConnectionsManagement />;
}
