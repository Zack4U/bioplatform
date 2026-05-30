"use client";

/**
 * ThreadItem — single conversation thread row in the threads list.
 * UI-only.
 *
 * @module components/features/community/ThreadItem
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials, formatRelativeTime } from "@/lib/formatters";
import type { DirectThreadSummary } from "@/types";
import { cn } from "@/lib/utils";

interface ThreadItemProps {
    thread: DirectThreadSummary;
    isActive?: boolean;
    onClick: () => void;
}

export function ThreadItem({ thread, isActive, onClick }: ThreadItemProps) {
    const displayName = thread.otherParticipantName ?? thread.title ?? "Conversacion";

    return (
        <button
            type="button"
            className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/60 transition-colors text-left",
                isActive && "bg-primary/10",
            )}
            onClick={onClick}
            aria-label={`Conversacion con ${displayName}`}
        >
            <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {getInitials(displayName)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <span className={cn("text-sm font-semibold truncate", isActive && "text-primary")}>
                        {displayName}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                        {thread.updatedAt ? formatRelativeTime(thread.updatedAt) : formatRelativeTime(thread.createdAt)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                        {thread.lastMessagePreview ?? "Sin mensajes aun"}
                    </p>
                    {thread.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground h-4 min-w-[1rem] text-[10px] px-1 shrink-0">
                            {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                        </Badge>
                    )}
                </div>
            </div>
        </button>
    );
}
