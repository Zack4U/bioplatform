import { CnnModelManagement } from "@/components/features/admin/ai-model/CnnModelManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion del Modelo CNN" };

export default function AiModelPage() {
    return <CnnModelManagement />;
}
