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

/** Hook to remove/cancel a connection */
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
