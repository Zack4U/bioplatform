import { PermitsManagement } from "@/components/features/admin/permits/PermitsManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Permisos ABS" };

export default function PermitsPage() {
    return <PermitsManagement />;
}
