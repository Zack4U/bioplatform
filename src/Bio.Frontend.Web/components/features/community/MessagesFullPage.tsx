"use client";

/**
 * MessagesFullPage — full-page chat experience for mobile.
 *
 * @module components/features/community/MessagesFullPage
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/features/community/MessageBubble";
import { MessageInput } from "@/components/features/community/MessageInput";
import { useMessages, useSendMessage, useMarkThreadRead } from "@/hooks/features/community";
import { useAuthStore } from "@/store/auth-store";
import { getInitials } from "@/lib/formatters";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface MessagesFullPageProps {
    threadId: string;
    threadTitle?: string;
}

export function MessagesFullPage({ threadId, threadTitle }: MessagesFullPageProps) {
    const router = useRouter();
    const { user } = useAuthStore();
    const { messages, isLoading } = useMessages(threadId);
    const sendMessage = useSendMessage(threadId);
    const markRead = useMarkThreadRead();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const displayName = threadTitle ?? "Conversacion";

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        markRead.mutate(threadId);
    }, [threadId]);

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)]">
            {/* Header */}
            <div className="flex items-center gap-3 px-3 py-3 border-b bg-background sticky top-16 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => router.back()}
                    aria-label="Volver a mensajes"
                >
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(displayName)}
                    </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{displayName}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 overscroll-contain">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">
                            Inicia la conversacion
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
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
            <div className="sticky bottom-0 bg-background border-t">
                <MessageInput
                    onSend={(content) => sendMessage.mutate({ content })}
                    isPending={sendMessage.isPending}
                    placeholder="Mensaje..."
                />
            </div>
        </div>
    );
}
