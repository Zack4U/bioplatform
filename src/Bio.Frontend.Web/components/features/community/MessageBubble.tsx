"use client";

/**
 * MessageBubble — single message bubble in a chat popup or full-page chat.
 * UI-only.
 *
 * @module components/features/community/MessageBubble
 */

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatters";
import type { DirectMessageResponse } from "@/types";

interface MessageBubbleProps {
    message: DirectMessageResponse;
    isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
    if (message.isDeleted) {
        return (
            <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                <span className="text-xs text-muted-foreground italic px-3 py-1">
                    [Mensaje eliminado]
                </span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col gap-0.5 max-w-[75%]",
                isOwn ? "items-end self-end" : "items-start self-start",
            )}
        >
            <div
                className={cn(
                    "rounded-2xl px-3 py-2 text-sm leading-relaxed break-words",
                    isOwn
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                )}
            >
                {message.content}
            </div>
            <span className="text-[10px] text-muted-foreground px-1">
                {formatRelativeTime(message.createdAt)}
            </span>
        </div>
    );
}
