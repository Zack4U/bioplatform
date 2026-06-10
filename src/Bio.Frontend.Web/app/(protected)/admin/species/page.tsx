import { SpeciesManagement } from "@/components/features/admin/species/SpeciesManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Especies" };

export default function SpeciesPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "RESEARCHER", "AUTHORITY"]}>
            <SpeciesManagement />
        </PageRoleGuard>
    );
}
