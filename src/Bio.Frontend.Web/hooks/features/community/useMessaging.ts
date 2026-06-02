/**
 * useMessaging — thread list, message fetching, send, and polling.
 *
 * Uses polling (refetchInterval) per backend REST-based read model.
 * Syncs unread count to notification-store for navbar badge.
 *
 * Architecture: Hook Pattern §2.2
 *
 * @module hooks/features/community/useMessaging
 */

"use client";

import {
    createThread,
    getMessages,
    getMyThreads,
    getUnreadMessageCount,
    markThreadAsRead,
    sendMessage,
} from "@/services/messaging-service";
import { POLLING_INTERVALS } from "@/lib/constants";
import { notificationService } from "@/lib/notifications";
import { useNotificationStore } from "@/store/notification-store";
import type {
    CreateDirectThreadDTO,
    DirectMessageResponse,
    DirectThreadSummary,
    PaginatedResponse,
    SendDirectMessageDTO,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/** Thread list with polling */
export function useThreads(params?: { page?: number }) {
    const { data, isLoading, isError } = useQuery<PaginatedResponse<DirectThreadSummary>>(
        {
            queryKey: ["messaging", "threads", params?.page],
            queryFn: () => getMyThreads({ page: params?.page }),
            refetchInterval: POLLING_INTERVALS.MESSAGES,
            staleTime: 10 * 1000,
        },
    );

    return {
        threads: data?.items ?? [],
        totalCount: data?.totalCount ?? 0,
        isLoading,
        isError,
    };
}

/** Messages in a thread with polling */
export function useMessages(threadId: string, enabled = true) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<PaginatedResponse<DirectMessageResponse>>({
        queryKey: ["messaging", "messages", threadId],
        queryFn: () => getMessages(threadId),
        enabled: !!threadId && enabled,
        refetchInterval: POLLING_INTERVALS.MESSAGES,
        staleTime: 5 * 1000,
    });

    function invalidateMessages() {
        queryClient.invalidateQueries({ queryKey: ["messaging", "messages", threadId] });
    }

    return {
        messages: data?.items ?? [],
        isLoading,
        invalidateMessages,
    };
}

/** Send a message in a thread with optimistic update */
export function useSendMessage(threadId: string) {
    const queryClient = useQueryClient();

    return useMutation<DirectMessageResponse, Error, SendDirectMessageDTO>({
        mutationFn: (dto) => sendMessage(threadId, dto),
        onMutate: async (dto) => {
            const key = ["messaging", "messages", threadId];
            await queryClient.cancelQueries({ queryKey: key });

            const optimisticMsg: DirectMessageResponse = {
                id: `optimistic-${Date.now()}`,
                threadId,
                senderUserId: "me",
                senderName: "Yo",
                content: dto.content,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                isRead: false,
            };

            queryClient.setQueryData<PaginatedResponse<DirectMessageResponse>>(key, (old) => {
                if (!old) return old;
                return { ...old, items: [...old.items, optimisticMsg] };
            });

            return { optimisticMsg };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messaging", "messages", threadId] });
            queryClient.invalidateQueries({ queryKey: ["messaging", "threads"] });
        },
        onError: () => {
            notificationService.error("No se pudo enviar el mensaje.");
            queryClient.invalidateQueries({ queryKey: ["messaging", "messages", threadId] });
        },
    });
}

/** Create a new thread. Callers should handle onSuccess to openChat with enriched data. */
export function useCreateThread() {
    const queryClient = useQueryClient();

    return useMutation<DirectThreadSummary, Error, CreateDirectThreadDTO>({
        mutationFn: (dto) => createThread(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messaging", "threads"] });
        },
        onError: () => {
            notificationService.error("No se pudo crear la conversacion.");
        },
    });
}

/** Mark thread messages as read */
export function useMarkThreadRead() {
    const queryClient = useQueryClient();

    return useMutation<{ markedAsRead: number }, Error, string>({
        mutationFn: (threadId) => markThreadAsRead(threadId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messaging", "threads"] });
        },
    });
}

/** Unread message count with polling — syncs to notification-store */
export function useUnreadMessageCount() {
    const setUnreadMessageCount = useNotificationStore((s) => s.setUnreadMessageCount);

    const { data } = useQuery({
        queryKey: ["messaging", "unread-count"],
        queryFn: getUnreadMessageCount,
        refetchInterval: POLLING_INTERVALS.UNREAD_COUNT,
        staleTime: POLLING_INTERVALS.UNREAD_COUNT,
    });

    useEffect(() => {
        if (data?.unreadCount !== undefined) {
            setUnreadMessageCount(data.unreadCount);
        }
    }, [data, setUnreadMessageCount]);

    return { unreadCount: data?.unreadCount ?? 0 };
}
