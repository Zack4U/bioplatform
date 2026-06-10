/**
 * Notification Service — typed API wrappers for in-app notifications.
 *
 * @module services/notification-service
 */

import { apiDelete, apiGet, apiGetPaginated, apiPut } from "@/services/api";
import { COMMUNITY_ROUTES } from "@/services/routes";
import type {
    NotificationResponse,
    PaginatedResponse,
    UnreadNotificationCount,
} from "@/types";

export interface GetNotificationsParams {
    isRead?: boolean | null;
    notificationType?: string | null;
    page?: number;
    pageSize?: number;
}

export async function getMyNotifications(
    params?: GetNotificationsParams,
): Promise<PaginatedResponse<NotificationResponse>> {
    return apiGetPaginated<NotificationResponse>(COMMUNITY_ROUTES.NOTIFICATIONS.BASE, {
        ...(params?.isRead !== null && params?.isRead !== undefined && { isRead: params.isRead }),
        ...(params?.notificationType && { notificationType: params.notificationType }),
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
    });
}

export async function getUnreadNotificationCount(): Promise<UnreadNotificationCount> {
    return apiGet<UnreadNotificationCount>(COMMUNITY_ROUTES.NOTIFICATIONS.UNREAD_COUNT);
}

export async function markNotificationAsRead(
    id: string,
): Promise<NotificationResponse> {
    return apiPut<object, NotificationResponse>(
        COMMUNITY_ROUTES.NOTIFICATIONS.MARK_READ(id),
        {},
    );
}

export async function markAllNotificationsAsRead(): Promise<void> {
    await apiPut<object, void>(COMMUNITY_ROUTES.NOTIFICATIONS.MARK_ALL_READ, {});
}

export async function deleteNotification(id: string): Promise<void> {
    await apiDelete<void>(COMMUNITY_ROUTES.NOTIFICATIONS.DELETE(id));
}
