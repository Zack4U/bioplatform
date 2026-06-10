import { ChatbotManagement } from "@/components/features/admin/chatbot/ChatbotManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion del Chatbot" };

export default function ChatbotPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "RESEARCHER"]}>
            <ChatbotManagement />
        </PageRoleGuard>
    );
}
