import { ImagesManagement } from "@/components/features/admin/images/ImagesManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Imagenes" };

export default function ImagesPage() {
    return <ImagesManagement />;
}
