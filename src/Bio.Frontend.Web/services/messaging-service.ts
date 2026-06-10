/**
 * Messaging Service — typed API wrappers for direct threads and messages.
 *
 * Backend is REST-based with polling (no WebSocket).
 *
 * @module services/messaging-service
 */

import { apiGet, apiGetPaginated, apiPost } from "@/services/api";
import { COMMUNITY_ROUTES } from "@/services/routes";
import type {
    CreateDirectThreadDTO,
    DirectMessageResponse,
    DirectThreadSummary,
    PaginatedResponse,
    SendDirectMessageDTO,
    UnreadCountResponse,
} from "@/types";

export async function getMyThreads(params?: {
    page?: number;
    pageSize?: number;
}): Promise<PaginatedResponse<DirectThreadSummary>> {
    return apiGetPaginated<DirectThreadSummary>(COMMUNITY_ROUTES.MESSAGING.THREADS, {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
    });
}

export async function createThread(
    dto: CreateDirectThreadDTO,
): Promise<DirectThreadSummary> {
    return apiPost<CreateDirectThreadDTO, DirectThreadSummary>(
        COMMUNITY_ROUTES.MESSAGING.THREADS,
        dto,
    );
}

export async function getMessages(
    threadId: string,
    params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<DirectMessageResponse>> {
    return apiGetPaginated<DirectMessageResponse>(
        COMMUNITY_ROUTES.MESSAGING.MESSAGES(threadId),
        { page: params?.page ?? 1, pageSize: params?.pageSize ?? 30 },
    );
}

export async function sendMessage(
    threadId: string,
    dto: SendDirectMessageDTO,
): Promise<DirectMessageResponse> {
    return apiPost<SendDirectMessageDTO, DirectMessageResponse>(
        COMMUNITY_ROUTES.MESSAGING.MESSAGES(threadId),
        dto,
    );
}

export async function markThreadAsRead(threadId: string): Promise<{ markedAsRead: number }> {
    return apiPost<object, { markedAsRead: number }>(
        COMMUNITY_ROUTES.MESSAGING.MARK_READ(threadId),
        {},
    );
}

export async function getUnreadMessageCount(): Promise<UnreadCountResponse> {
    return apiGet<UnreadCountResponse>(COMMUNITY_ROUTES.MESSAGING.UNREAD_COUNT);
}
