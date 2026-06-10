"use client";

/**
 * ChatPopup — floating chat window for desktop (350x450px).
 * Part of the Facebook-style chat popup system.
 *
 * @module components/features/community/ChatPopup
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/features/community/MessageBubble";
import { MessageInput } from "@/components/features/community/MessageInput";
import { useMessages, useSendMessage, useMarkThreadRead } from "@/hooks/features/community";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { getInitials } from "@/lib/formatters";
import type { ChatPopupEntry } from "@/store/chat-store";
import { Minus, X, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";


interface ChatPopupProps {
    entry: ChatPopupEntry;
    index: number;
}

export function ChatPopup({ entry, index }: ChatPopupProps) {
    const { thread } = entry;
    const closeChat = useChatStore((s) => s.closeChat);
    const minimizeChat = useChatStore((s) => s.minimizeChat);
    const { user } = useAuthStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, isLoading, invalidateMessages } = useMessages(thread.id);
    const sendMessage = useSendMessage(thread.id);
    const markRead = useMarkThreadRead();

    const displayName = thread.otherParticipantName ?? thread.title ?? "Conversacion";

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Mark as read when opened
    useEffect(() => {
        if (thread.unreadCount > 0) {
            markRead.mutate(thread.id);
        }
    }, [thread.id, thread.unreadCount, markRead]);

    // Position: stack from right, 10px gap between popups
    const rightOffset = 16 + index * (350 + 12);

    return (
        <div
            className="fixed bottom-0 z-50 flex flex-col rounded-t-xl border bg-card shadow-2xl"
            style={{ width: 350, right: rightOffset }}
            role="dialog"
            aria-label={`Chat con ${displayName}`}
        >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-3 py-2 bg-primary rounded-t-xl">
                <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-semibold">
                        {getInitials(displayName)}
                    </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-semibold text-primary-foreground truncate">
                    {displayName}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
                        onClick={invalidateMessages}
                        aria-label="Actualizar mensajes"
                    >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
                        onClick={() => minimizeChat(thread.id)}
                        aria-label="Minimizar chat"
                    >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
                        onClick={() => closeChat(thread.id)}
                        aria-label="Cerrar chat"
                    >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            {/* Messages — oldest at top, newest at bottom (WhatsApp style) */}
            <div className="flex flex-col gap-1 overflow-y-auto p-3 h-[380px] overscroll-contain">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-xs text-muted-foreground">Cargando mensajes...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-xs text-muted-foreground">
                            Inicia la conversacion
                        </p>
                    </div>
                ) : (
                    [...messages].reverse().map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={msg.senderUserId === user?.id}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <MessageInput
                onSend={(content) => sendMessage.mutate({ content })}
                isPending={sendMessage.isPending}
            />
        </div>
    );
}
