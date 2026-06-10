/**
 * Assistant Service — Handles AI advisor interactions.
 */

import { apiPost } from "./api";

export interface ChatMessage {
    role: "user" | "model";
    content: string;
}

export interface AskAssistantRequest {
    question: string;
    history?: ChatMessage[];
}

export interface AssistantResponse {
    answer: string;
}

/**
 * Ask a question to the AI Assistant.
 * Endpoint: POST /api/Assistant/ask
 */
export async function askAssistant(
    request: AskAssistantRequest,
): Promise<AssistantResponse> {
    return apiPost<AskAssistantRequest, AssistantResponse>(
        "/Assistant/ask",
        request,
    );
}
