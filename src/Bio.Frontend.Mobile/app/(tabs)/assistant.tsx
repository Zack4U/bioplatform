/**
 * AI Assistant Screen — BioCommerce Caldas Mobile.
 *
 * ChatGPT/Gemini-style conversational interface for the RAG assistant.
 * Currently uses mock responses — ready for API integration.
 *
 * Composes subcomponents:
 * - ChatHeader: top bar with bot icon and status
 * - ChatBubble: individual message rendering
 * - TypingIndicator: 3-dot animation while AI responds
 * - SuggestedPrompts: prompt chips when chat is empty
 * - ChatInput: bottom input bar with send button
 */

import { ChatBubble } from "@/components/assistant/ChatBubble";
import { ChatHeader } from "@/components/assistant/ChatHeader";
import { ChatInput } from "@/components/assistant/ChatInput";
import { SuggestedPrompts } from "@/components/assistant/SuggestedPrompts";
import { TypingIndicator } from "@/components/assistant/TypingIndicator";
import type { ChatMessage, ChatSource } from "@/types";
import React, { useCallback, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from "react-native";

// ─── Mock Responses ─────────────────────────────────────────────────────────

const MOCK_RESPONSES: Record<string, { content: string; sources?: ChatSource[] }> = {
    default: {
        content:
            "¡Hola! Soy el asistente de BioCommerce Caldas. Puedo ayudarte con información sobre la biodiversidad de Caldas, planes de biocomercio, normativa ambiental y mucho más.\n\nPor ahora estoy en modo demo, pero pronto estaré conectado al sistema RAG con información de más de 1,000 especies. 🌿",
        sources: [
            {
                speciesId: "sp-001",
                scientificName: "Quercus humboldtii",
                relevanceScore: 0.95,
                snippet: "Especie nativa de los bosques andinos de Colombia.",
            },
        ],
    },
    peligro: {
        content:
            "En Caldas hay varias especies en peligro. Algunas de las más relevantes son:\n\n🌿 **Ceroxylon quindiuense** (Palma de cera) — Vulnerable\n🐻 **Tremarctos ornatus** (Oso de anteojos) — Vulnerable\n🦜 **Hapalopsittaca fuertesi** (Loro multicolor) — En Peligro Crítico\n\nEstas especies están protegidas bajo la legislación colombiana y requieren permisos especiales para cualquier actividad de biocomercio.",
        sources: [
            {
                speciesId: "sp-002",
                scientificName: "Ceroxylon quindiuense",
                relevanceScore: 0.97,
                snippet: "Palma de cera, árbol nacional de Colombia.",
            },
            {
                speciesId: "sp-004",
                scientificName: "Tremarctos ornatus",
                relevanceScore: 0.91,
                snippet: "Único oso nativo de Sudamérica.",
            },
        ],
    },
    biocomercio: {
        content:
            "Un plan de biocomercio con frailejón debe considerar:\n\n1. **Marco legal**: El frailejón está protegido. No se permite su extracción directa.\n2. **Alternativas sostenibles**: Ecoturismo en páramos, educación ambiental, fotografía de naturaleza.\n3. **Bioprospección**: Investigación de compuestos bioactivos con permisos ABS (Protocolo de Nagoya).\n\n¿Deseas que genere un plan de negocio detallado? 📋",
    },
    nagoya: {
        content:
            "El **Protocolo de Nagoya** (2010) regula el acceso a recursos genéticos y la participación justa en los beneficios derivados de su utilización.\n\nEn Colombia, se implementa a través del **Decreto 3016 de 2013** y la **Decisión 391 de 1996** de la CAN.\n\nPara cualquier producto de biocomercio basado en especies nativas, necesitas un **Permiso de Acceso a Recursos Genéticos (ABS)** emitido por el MADS. 📜",
    },
    roble: {
        content:
            "El **Roble de tierra fría** (*Quercus humboldtii*) tiene múltiples usos tradicionales:\n\n🪵 **Madera**: Alta calidad para construcción y ebanistería.\n🧪 **Medicina tradicional**: Corteza usada como astringente.\n🍃 **Taninos**: Extracción para curtimiento de cueros.\n🌳 **Ambiental**: Reforestación y captura de carbono.\n\nOportunidades de biocomercio: madera certificada FSC, turismo ecológico, restauración ecológica.",
        sources: [
            {
                speciesId: "sp-001",
                scientificName: "Quercus humboldtii",
                relevanceScore: 0.98,
                snippet: "Árbol nativo de los bosques andinos, hasta 30m.",
            },
        ],
    },
};

function getMockResponse(userMessage: string): { content: string; sources?: ChatSource[] } {
    const msg = userMessage.toLowerCase();
    if (msg.includes("peligro") || msg.includes("amenaza")) return MOCK_RESPONSES.peligro;
    if (msg.includes("biocomercio") || msg.includes("plan") || msg.includes("negocio"))
        return MOCK_RESPONSES.biocomercio;
    if (msg.includes("nagoya") || msg.includes("protocolo") || msg.includes("permiso"))
        return MOCK_RESPONSES.nagoya;
    if (msg.includes("roble") || msg.includes("quercus") || msg.includes("tradicional"))
        return MOCK_RESPONSES.roble;
    return MOCK_RESPONSES.default;
}

// ─── Welcome Message ────────────────────────────────────────────────────────

const WELCOME_MESSAGE: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content:
        "¡Bienvenido al Asistente de BioCommerce Caldas! 🌿\n\nSoy tu guía en biodiversidad, biocomercio y normativa ambiental. Pregúntame lo que necesites o elige una de las sugerencias para comenzar.",
    timestamp: new Date().toISOString(),
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function AssistantScreen() {
    const flatListRef = useRef<FlatList<ChatMessage>>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const sendMessage = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isTyping) return;

            const userMsg: ChatMessage = {
                id: `msg-${Date.now()}`,
                role: "user",
                content: trimmed,
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, userMsg]);
            setInputText("");
            setIsTyping(true);

            // Simulate AI response delay
            setTimeout(() => {
                const response = getMockResponse(trimmed);
                const assistantMsg: ChatMessage = {
                    id: `msg-${Date.now()}-ai`,
                    role: "assistant",
                    content: response.content,
                    timestamp: new Date().toISOString(),
                    sources: response.sources,
                };
                setMessages((prev) => [...prev, assistantMsg]);
                setIsTyping(false);
            }, 1200 + Math.random() * 800);
        },
        [isTyping],
    );

    const showSuggestions = messages.length <= 1;

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <ChatHeader />

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ChatBubble message={item} />}
                contentContainerStyle={{ paddingVertical: 16 }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                }
                ListFooterComponent={
                    <>
                        {isTyping && <TypingIndicator />}
                        {showSuggestions && !isTyping && (
                            <SuggestedPrompts onSelect={sendMessage} />
                        )}
                    </>
                }
            />

            {/* Input */}
            <ChatInput
                value={inputText}
                onChange={setInputText}
                onSend={() => sendMessage(inputText)}
                disabled={isTyping}
            />
        </KeyboardAvoidingView>
    );
}
