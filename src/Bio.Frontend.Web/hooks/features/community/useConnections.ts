/**
 * useConnections — manages user connections, pending requests, and connection mutations.
 *
 * Architecture: Hook Pattern §2.2
 *
 * @module hooks/features/community/useConnections
 */

"use client";

import {
    deleteConnection,
    getMyConnections,
    getPendingRequests,
    respondToRequest,
    sendConnectionRequest,
} from "@/services/networking-service";
import { notificationService } from "@/lib/notifications";
import type {
    PaginatedResponse,
    UserConnectionRequestDTO,
    UserConnectionResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Hook for accepted connections list with search */
export function useMyConnections(params?: { page?: number; pageSize?: number }) {
    const { data, isLoading, isError } = useQuery<PaginatedResponse<UserConnectionResponse>>(
        {
            queryKey: ["networking", "connections", "accepted", params?.page],
            queryFn: () =>
                getMyConnections({ status: "Accepted", page: params?.page, pageSize: params?.pageSize }),
            staleTime: 2 * 60 * 1000,
        },
    );

    return {
        connections: data?.items ?? [],
        totalCount: data?.totalCount ?? 0,
        totalPages: data?.totalPages ?? 1,
        isLoading,
        isError,
    };
}

/** Hook for pending received connection requests */
export function usePendingRequests(params?: { page?: number }) {
    const { data, isLoading, isError } = useQuery<PaginatedResponse<UserConnectionResponse>>(
        {
            queryKey: ["networking", "connections", "pending", params?.page],
            queryFn: () => getPendingRequests({ page: params?.page }),
            staleTime: 30 * 1000,
        },
    );

    return {
        pending: data?.items ?? [],
        totalCount: data?.totalCount ?? 0,
        isLoading,
        isError,
    };
}

/** Hook for outgoing (sent) pending connection requests */
export function useSentRequests(userId?: string) {
    const { data, isLoading, isError } = useQuery<PaginatedResponse<UserConnectionResponse>>(
        {
            queryKey: ["networking", "connections", "sent", userId],
            queryFn: () => getMyConnections({ status: "Pending", pageSize: 50 }),
            staleTime: 30 * 1000,
            enabled: !!userId,
        },
    );

    // Only the ones where the current user is the requester
    const sent = (data?.items ?? []).filter((c) => c.requesterId === userId);

    return {
        sent,
        totalCount: sent.length,
        isLoading,
        isError,
    };
}

/**
 * Hook to check if the current user already has a pending or accepted
 * connection with a target user. Returns the connection if found.
 */
export function useConnectionStatus(currentUserId?: string, targetUserId?: string) {
    // Fetch pending connections (includes sent and received)
    const { data: pendingData, isLoading: loadingPending } = useQuery<PaginatedResponse<UserConnectionResponse>>(
        {
            queryKey: ["networking", "connections", "status-pending", currentUserId, targetUserId],
            queryFn: () => getMyConnections({ status: "Pending", pageSize: 100 }),
            staleTime: 30 * 1000,
            enabled: !!currentUserId && !!targetUserId,
        },
    );

    // Fetch accepted connections
    const { data: acceptedData, isLoading: loadingAccepted } = useQuery<PaginatedResponse<UserConnectionResponse>>(
        {
            queryKey: ["networking", "connections", "status-accepted", currentUserId, targetUserId],
            queryFn: () => getMyConnections({ status: "Accepted", pageSize: 100 }),
            staleTime: 60 * 1000,
            enabled: !!currentUserId && !!targetUserId,
        },
    );

    const allItems = [...(pendingData?.items ?? []), ...(acceptedData?.items ?? [])];

    const existing = allItems.find(
        (c) =>
            (c.requesterId === currentUserId && c.addresseeId === targetUserId) ||
            (c.requesterId === targetUserId && c.addresseeId === currentUserId),
    );

    return {
        isLoading: loadingPending || loadingAccepted,
        existing,
        /** Current user sent a request to targetUser and it's still pending */
        isSentPending: existing?.status === "Pending" && existing?.requesterId === currentUserId,
        /** Current user received a request from targetUser */
        isReceivedPending: existing?.status === "Pending" && existing?.requesterId === targetUserId,
        /** Both users are connected */
        isAccepted: existing?.status === "Accepted",
    };
}

/** Hook to send a connection request */
export function useSendConnectionRequest() {
    const queryClient = useQueryClient();

    return useMutation<UserConnectionResponse, Error, UserConnectionRequestDTO>({
        mutationFn: (dto) => sendConnectionRequest(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["networking", "connections"] });
            notificationService.success("Solicitud de conexion enviada.");
        },
        onError: () => {
            notificationService.error("No se pudo enviar la solicitud.");
        },
    });
}

/** Hook to respond to a connection request (Accept/Reject/Block) */
export function useRespondToRequest() {
    const queryClient = useQueryClient();

    return useMutation<
        UserConnectionResponse,
        Error,
        { connectionId: string; action: "Accept" | "Reject" | "Block" }
    >({
        mutationFn: ({ connectionId, action }) =>
            respondToRequest(connectionId, { action }),
        onSuccess: (_, { action }) => {
            queryClient.invalidateQueries({ queryKey: ["networking", "connections"] });
            const messages: Record<string, string> = {
                Accept: "Conexion aceptada.",
                Reject: "Solicitud rechazada.",
                Block: "Usuario bloqueado.",
            };
            notificationService.success(messages[action] ?? "Accion realizada.");
        },
        onError: () => {
            notificationService.error("No se pudo procesar la solicitud.");
        },
    });
}

/** Hook to remove an accepted connection */
export function useDeleteConnection() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: (connectionId) => deleteConnection(connectionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["networking", "connections"] });
            notificationService.success("Conexion eliminada.");
        },
        onError: () => {
            notificationService.error("No se pudo eliminar la conexion.");
        },
    });
}

/** Hook to cancel a sent pending request */
export function useCancelRequest() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: (connectionId) => deleteConnection(connectionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["networking", "connections"] });
            notificationService.success("Solicitud cancelada.");
        },
        onError: () => {
            notificationService.error("No se pudo cancelar la solicitud.");
        },
    });
}
