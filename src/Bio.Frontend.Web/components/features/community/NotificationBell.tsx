"use client";

/**
 * NotificationBell — navbar bell icon with unread count badge.
 * Desktop: opens Popover. Mobile: opens Drawer.
 *
 * @module components/features/community/NotificationBell
 */

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { NotificationItem } from "@/components/features/community/NotificationItem";
import {
    useNotificationList,
    useUnreadNotificationCount,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    useDeleteNotification,
} from "@/hooks/features/community";
import { useNotificationStore } from "@/store/notification-store";
import { useIsMd } from "@/hooks/useMediaQuery";
import { Bell } from "lucide-react";
import { Button as Btn } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

function NotificationPanel({ onClose }: { onClose?: () => void }) {
    const { notifications, isLoading } = useNotificationList({ pageSize: 8 });
    const markRead = useMarkNotificationRead();
    const markAll = useMarkAllNotificationsRead();
    const deleteNotification = useDeleteNotification();

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-sm font-semibold">Notificaciones</span>
                <Btn
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary h-auto py-1"
                    onClick={() => markAll.mutate()}
                    disabled={markAll.isPending}
                >
                    Marcar todo como leido
                </Btn>
            </div>

            <div className="overflow-y-auto max-h-80" role="list" aria-label="Lista de notificaciones">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        Cargando...
                    </p>
                ) : notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        Sin notificaciones nuevas
                    </p>
                ) : (
                    notifications.map((n) => (
                        <NotificationItem
                            key={n.id}
                            notification={n}
                            onMarkRead={(id) => markRead.mutate(id)}
                            onDelete={(id) => deleteNotification.mutate(id)}
                            compact
                        />
                    ))
                )}
            </div>

            <div className="border-t p-2">
                <Link
                    href="/notifications"
                    className="block text-center text-xs text-primary hover:underline py-1"
                    onClick={onClose}
                >
                    Ver todas las notificaciones
                </Link>
            </div>
        </div>
    );
}

export function NotificationBell() {
    // Ensure polling is active by mounting the count hook here
    useUnreadNotificationCount();
    const unreadCount = useNotificationStore((s) => s.unreadNotificationCount);
    const isDesktop = useIsMd();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const renderBellButton = (onClick?: () => void) => (
        <Button
            id="notification-bell-btn"
            variant="outline"
            size="icon"
            className="relative"
            onClick={onClick}
            aria-label={`Notificaciones: ${unreadCount} sin leer`}
        >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {unreadCount > 0 && (
                <span
                    className={cn(
                        "absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground",
                    )}
                    aria-hidden="true"
                >
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </Button>
    );

    if (isDesktop) {
        return (
            <Popover>
                <PopoverTrigger asChild>{renderBellButton()}</PopoverTrigger>
                <PopoverContent
                    align="end"
                    className="w-80 p-0"
                    aria-label="Panel de notificaciones"
                >
                    <NotificationPanel />
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <>
            {renderBellButton(() => setDrawerOpen(true))}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader className="pb-0">
                        <DrawerTitle>Notificaciones</DrawerTitle>
                    </DrawerHeader>
                    <NotificationPanel onClose={() => setDrawerOpen(false)} />
                </DrawerContent>
            </Drawer>
        </>
    );
}
