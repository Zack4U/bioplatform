"use client";

/**
 * NotificationItem — single notification row in the bell dropdown or notifications page.
 * UI-only.
 *
 * @module components/features/community/NotificationItem
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatters";
import type { NotificationResponse } from "@/types";
import { Bell, MessageCircle, ThumbsUp, UserPlus, X, ShoppingBag } from "lucide-react";

interface NotificationItemProps {
    notification: NotificationResponse;
    onMarkRead?: (id: string) => void;
    onDelete?: (id: string) => void;
    compact?: boolean;
}

function getNotificationIcon(type: string) {
    const iconClass = "h-4 w-4";
    switch (type?.toLowerCase()) {
        case "reaction":
            return <ThumbsUp className={iconClass} aria-hidden="true" />;
        case "comment":
            return <MessageCircle className={iconClass} aria-hidden="true" />;
        case "connection_request":
        case "connection_accepted":
            return <UserPlus className={iconClass} aria-hidden="true" />;
        case "message":
            return <MessageCircle className={iconClass} aria-hidden="true" />;
        case "order":
            return <ShoppingBag className={iconClass} aria-hidden="true" />;
        default:
            return <Bell className={iconClass} aria-hidden="true" />;
    }
}

export function NotificationItem({
    notification,
    onMarkRead,
    onDelete,
    compact,
}: NotificationItemProps) {
    return (
        <div
            className={cn(
                "flex items-start gap-3 px-3 py-3 rounded-lg transition-colors group",
                !notification.isRead && "bg-primary/5 hover:bg-primary/10",
                notification.isRead && "hover:bg-muted/60",
            )}
            role="listitem"
        >
            {/* Icon */}
            <div
                className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    !notification.isRead ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}
            >
                {getNotificationIcon(notification.notificationType)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-0.5">
                <p
                    className={cn(
                        "text-sm leading-snug",
                        !notification.isRead && "font-medium",
                    )}
                >
                    {notification.title}
                </p>
                {!compact && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                    </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                </p>
            </div>

            {/* Unread dot + actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
                {!notification.isRead && (
                    <span
                        className="h-2 w-2 rounded-full bg-primary"
                        aria-label="No leida"
                    />
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && onMarkRead && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onMarkRead(notification.id)}
                            aria-label="Marcar como leida"
                        >
                            <Bell className="h-3 w-3" aria-hidden="true" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete(notification.id)}
                            aria-label="Eliminar notificacion"
                        >
                            <X className="h-3 w-3" aria-hidden="true" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
