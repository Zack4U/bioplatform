import { SpeciesManagement } from "@/components/features/admin/species/SpeciesManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Especies" };

export default function SpeciesPage() {
    return <SpeciesManagement />;
}
