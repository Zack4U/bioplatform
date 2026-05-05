import { RequestsManagement } from "@/components/features/admin/requests/RequestsManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Solicitudes" };

export default function RequestsPage() {
    return <RequestsManagement />;
}
