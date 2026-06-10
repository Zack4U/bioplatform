"use client";

/**
 * Notifications full page — all notifications with filter and bulk actions.
 *
 * @module app/(protected)/notifications/page
 */

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationItem } from "@/components/features/community/NotificationItem";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
    useNotificationList,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    useDeleteNotification,
} from "@/hooks/features/community";
import { Bell } from "lucide-react";

function NotificationSkeletons() {
    return (
        <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-lg">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-48" />
                        <Skeleton className="h-3 w-64" />
                        <Skeleton className="h-2.5 w-16" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function NotificationListPanel({ isRead }: { isRead?: boolean | null }) {
    const { notifications, isLoading } = useNotificationList({ isRead, pageSize: 20 });
    const markRead = useMarkNotificationRead();
    const deleteNotification = useDeleteNotification();

    if (isLoading) return <NotificationSkeletons />;

    if (notifications.length === 0) {
        return (
            <EmptyState
                icon={<Bell className="h-6 w-6" />}
                title="Sin notificaciones"
                description={
                    isRead === false
                        ? "No tienes notificaciones sin leer."
                        : "No tienes notificaciones."
                }
            />
        );
    }

    return (
        <div role="list" aria-label="Lista de notificaciones">
            {notifications.map((n) => (
                <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkRead={(id) => markRead.mutate(id)}
                    onDelete={(id) => deleteNotification.mutate(id)}
                />
            ))}
        </div>
    );
}

export default function NotificationsPage() {
    const markAll = useMarkAllNotificationsRead();

    return (
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Notificaciones</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tus ultimas actividades y alertas.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAll.mutate()}
                    disabled={markAll.isPending}
                    id="mark-all-read-btn"
                >
                    Marcar todo como leido
                </Button>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
                <Tabs defaultValue="all">
                    <div className="border-b px-3 pt-3">
                        <TabsList className="mb-0">
                            <TabsTrigger value="all" id="notif-tab-all">Todas</TabsTrigger>
                            <TabsTrigger value="unread" id="notif-tab-unread">No leidas</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="all" className="mt-0 py-2">
                        <NotificationListPanel />
                    </TabsContent>
                    <TabsContent value="unread" className="mt-0 py-2">
                        <NotificationListPanel isRead={false} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
