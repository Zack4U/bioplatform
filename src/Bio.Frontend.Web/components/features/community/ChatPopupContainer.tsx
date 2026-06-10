"use client";

/**
 * ChatPopupContainer — renders floating chat popups and minimized bubbles.
 * Fixed positioned, renders in root layout outside of main content flow.
 *
 * @module components/features/community/ChatPopupContainer
 */

import { ChatPopup } from "@/components/features/community/ChatPopup";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChatStore } from "@/store/chat-store";
import { getInitials } from "@/lib/formatters";
import { useIsMd } from "@/hooks/useMediaQuery";

export function ChatPopupContainer() {
    const { chats, restoreChat } = useChatStore();
    const isDesktop = useIsMd();

    // Only render on desktop
    if (!isDesktop) return null;

    const openChats = chats.filter((c) => !c.isMinimized);
    const minimizedChats = chats.filter((c) => c.isMinimized);

    return (
        <>
            {/* Open chat popups */}
            {openChats.map((entry, i) => (
                <ChatPopup key={entry.thread.id} entry={entry} index={i} />
            ))}

            {/* Minimized chat bubbles */}
            {minimizedChats.length > 0 && (
                <div
                    className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2"
                    style={{
                        right: openChats.length > 0
                            ? 16 + openChats.length * (350 + 12)
                            : 16,
                    }}
                >
                    {minimizedChats.map((entry) => {
                        const displayName =
                            entry.thread.otherParticipantName ??
                            entry.thread.title ??
                            "Chat";
                        return (
                            <button
                                key={entry.thread.id}
                                type="button"
                                className="relative flex items-center gap-2 rounded-full bg-primary pl-0.5 pr-3 py-0.5 shadow-lg hover:shadow-xl transition-shadow"
                                onClick={() => restoreChat(entry.thread.id)}
                                aria-label={`Restaurar chat con ${displayName}`}
                            >
                                <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-semibold">
                                        {getInitials(displayName)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-primary-foreground font-medium max-w-[120px] truncate">
                                    {displayName}
                                </span>
                                {entry.thread.unreadCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-4 min-w-[1rem] text-[10px] px-1 bg-destructive text-destructive-foreground">
                                        {entry.thread.unreadCount}
                                    </Badge>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </>
    );
}
