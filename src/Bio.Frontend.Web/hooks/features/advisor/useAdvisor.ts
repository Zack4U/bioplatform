/**
 * useAdvisor — Custom hook for the AI Advisor chat interface.
 * Manages message history, loading states, and interactions with the AI service.
 */

"use client";

import { askAssistant } from "@/services/assistant-service";
import { useMutation } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export function useAdvisor() {
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const mutation = useMutation({
        mutationFn: (question: string) => {
            // Map messages to API format: user -> user, assistant -> model
            const history = messages.map(msg => ({
                role: (msg.role === "assistant" ? "model" : "user") as "user" | "model",
                content: msg.content
            }));
            
            return askAssistant({ 
                question,
                history
            });
        },
        onSuccess: (data) => {
            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.answer,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
        },
        onError: (error: Error) => {
            console.error("Error asking assistant:", error);
            toast.error("Hubo un error al procesar tu pregunta. Por favor intenta de nuevo.");
        },
    });

    const sendMessage = useCallback((content: string) => {
        if (!content.trim() || mutation.isPending) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        mutation.mutate(content);
    }, [mutation]);

    const clearChat = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        messages,
        sendMessage,
        clearChat,
        isLoading: mutation.isPending,
        scrollRef,
    };
}
