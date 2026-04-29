import { ChatbotManagement } from "@/components/features/admin/chatbot/ChatbotManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion del Chatbot" };

export default function ChatbotPage() {
    return <ChatbotManagement />;
}
