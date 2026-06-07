/**
 * useNotifications — notification list, unread count polling, and mutations.
 *
 * Syncs unread count to notification-store for navbar badge.
 *
 * Architecture: Hook Pattern §2.2
 *
 * @module hooks/features/community/useNotifications
 */

"use client";

import {
    deleteNotification,
    getMyNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "@/services/notification-service";
import { POLLING_INTERVALS } from "@/lib/constants";
import { notificationService } from "@/lib/notifications";
import { useNotificationStore } from "@/store/notification-store";
import type { NotificationResponse, PaginatedResponse } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export interface UseNotificationsParams {
    isRead?: boolean | null;
    page?: number;
    pageSize?: number;
}

/** Paginated notification list */
export function useNotificationList(params?: UseNotificationsParams) {
    const { data, isLoading, isError } = useQuery<PaginatedResponse<NotificationResponse>>({
        queryKey: ["notifications", "list", params?.isRead, params?.page],
        queryFn: () =>
            getMyNotifications({
                isRead: params?.isRead,
                page: params?.page ?? 1,
                pageSize: params?.pageSize ?? 20,
            }),
        staleTime: 30 * 1000,
    });

    return {
        notifications: data?.items ?? [],
        totalCount: data?.totalCount ?? 0,
        totalPages: data?.totalPages ?? 1,
        isLoading,
        isError,
    };
}

/** Unread notification count with polling — syncs to notification-store */
export function useUnreadNotificationCount() {
    const setUnreadNotificationCount = useNotificationStore(
        (s) => s.setUnreadNotificationCount,
    );

    const { data } = useQuery({
        queryKey: ["notifications", "unread-count"],
        queryFn: getUnreadNotificationCount,
        refetchInterval: POLLING_INTERVALS.UNREAD_COUNT,
        staleTime: POLLING_INTERVALS.UNREAD_COUNT,
    });

    useEffect(() => {
        if (data?.unreadCount !== undefined) {
            setUnreadNotificationCount(data.unreadCount);
        }
    }, [data, setUnreadNotificationCount]);

    return { unreadCount: data?.unreadCount ?? 0 };
}

/** Mark a single notification as read */
export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    const decrementNotificationCount = useNotificationStore(
        (s) => s.decrementNotificationCount,
    );

    return useMutation<NotificationResponse, Error, string>({
        mutationFn: (id) => markNotificationAsRead(id),
        onSuccess: (updated) => {
            // Optimistic: update item in cache
            queryClient.setQueryData<PaginatedResponse<NotificationResponse>>(
                ["notifications", "list", null, 1],
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        items: old.items.map((n) => (n.id === updated.id ? updated : n)),
                    };
                },
            );
            decrementNotificationCount();
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
        },
    });
}

/** Mark all notifications as read */
export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();
    const setUnreadNotificationCount = useNotificationStore(
        (s) => s.setUnreadNotificationCount,
    );

    return useMutation<void, Error, void>({
        mutationFn: () => markAllNotificationsAsRead(),
        onSuccess: () => {
            setUnreadNotificationCount(0);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            notificationService.success("Todas las notificaciones marcadas como leidas.");
        },
    });
}

/** Delete a notification */
export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: (id) => deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
        onError: () => {
            notificationService.error("No se pudo eliminar la notificacion.");
        },
    });
}
