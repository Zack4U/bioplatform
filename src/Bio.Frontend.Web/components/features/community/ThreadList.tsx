"use client";

/**
 * ThreadList — paginated list of message threads.
 *
 * @module components/features/community/ThreadList
 */

import { ThreadItem } from "@/components/features/community/ThreadItem";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useThreads } from "@/hooks/features/community";
import { useChatStore } from "@/store/chat-store";
import { useIsMd } from "@/hooks/useMediaQuery";
import type { DirectThreadSummary } from "@/types";
import { MessageCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NewThreadDialog } from "@/components/features/community/NewThreadDialog";

export function ThreadList() {
    const { threads, isLoading } = useThreads();
    const openChat = useChatStore((s) => s.openChat);
    const isDesktop = useIsMd();
    const router = useRouter();
    const [newDialogOpen, setNewDialogOpen] = useState(false);

    function handleThreadClick(thread: DirectThreadSummary) {
        if (isDesktop) {
            openChat(thread);
        } else {
            const name = thread.otherParticipantName ?? thread.title ?? 'Conversacion';
            router.push(`/community/messages/${thread.id}?name=${encodeURIComponent(name)}`);
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b">
                <h2 className="font-semibold text-sm">Mensajes</h2>
                <Button
                    id="new-message-btn"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setNewDialogOpen(true)}
                    aria-label="Nuevo mensaje"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="space-y-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-3">
                                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-3.5 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : threads.length === 0 ? (
                    <EmptyState
                        icon={<MessageCircle className="h-6 w-6" />}
                        title="Sin mensajes"
                        description="Inicia una conversacion con algun contacto."
                    />
                ) : (
                    <div className="space-y-0.5">
                        {threads.map((thread) => (
                            <ThreadItem
                                key={thread.id}
                                thread={thread}
                                onClick={() => handleThreadClick(thread)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <NewThreadDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />
        </div>
    );
}
