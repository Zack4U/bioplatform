/**
 * useAdminCommunity — admin-level hooks for community posts, comments, and connections.
 *
 * Architecture: Hook Pattern §2.2 — all admin logic here, UI components are UI-only.
 *
 * @module hooks/features/admin/useAdminCommunity
 */

"use client";

import {
    deletePost,
    getComments,
    getPosts,
    pinPost,
    unpinPost,
    updatePost,
} from "@/services/community-service";
import { deleteConnection, getMyConnections, getPendingRequests } from "@/services/networking-service";
import { notificationService } from "@/lib/notifications";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import type {
    AdminConnectionFilters,
    AdminPostFilters,
    CommunityPostDetail,
    PaginatedResponse,
    CommunityPostListItem,
    CommunityCommentResponse,
    UserConnectionResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Admin Posts ───────────────────────────────────────────────────────────────

export function useAdminPosts(filters: AdminPostFilters = {}) {
    const { data, isLoading, isError } = useQuery<PaginatedResponse<CommunityPostListItem>>({
        queryKey: ["admin", "community", "posts", filters],
        queryFn: () =>
            getPosts({
                category: filters.category ?? null,
                status: filters.status ?? null,
                page: filters.page ?? 1,
                pageSize: filters.pageSize ?? ADMIN_PAGE_SIZE,
            }),
        staleTime: 60 * 1000,
    });

    return {
        posts: data?.items ?? [],
        totalCount: data?.totalCount ?? 0,
        totalPages: data?.totalPages ?? 1,
        isLoading,
        isError,
    };
}

export function useAdminDeletePost() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: (id) => deletePost(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "community", "posts"] });
            queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
            notificationService.success("Post eliminado.");
        },
        onError: () => notificationService.error("No se pudo eliminar el post."),
    });
}

export function useAdminTogglePin() {
    const queryClient = useQueryClient();
    return useMutation<CommunityPostDetail, Error, { id: string; isPinned: boolean }>({
        mutationFn: ({ id, isPinned }) => (isPinned ? unpinPost(id) : pinPost(id)),
        onSuccess: (post) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "community", "posts"] });
            queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
            notificationService.success(
                post.isPinned ? "Post destacado." : "Post sin destacar.",
            );
        },
        onError: () => notificationService.error("No se pudo cambiar el estado del post."),
    });
}

export function useAdminChangePostStatus() {
    const queryClient = useQueryClient();
    return useMutation<
        CommunityPostDetail,
        Error,
        { id: string; status: "Draft" | "Published" | "Archived" | "Hidden" }
    >({
        mutationFn: ({ id, status }) => updatePost(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "community", "posts"] });
            queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
            notificationService.success("Estado del post actualizado.");
        },
        onError: () => notificationService.error("No se pudo cambiar el estado."),
    });
}

// ── Admin Comments ────────────────────────────────────────────────────────────

export function useAdminComments(postId: string, page = 1) {
    const { data, isLoading, isError } = useQuery<PaginatedResponse<CommunityCommentResponse>>({
        queryKey: ["admin", "community", "comments", postId, page],
        queryFn: () => getComments(postId, { page, pageSize: ADMIN_PAGE_SIZE }),
        enabled: !!postId,
        staleTime: 60 * 1000,
    });

    return {
        comments: data?.items ?? [],
        totalCount: data?.totalCount ?? 0,
        totalPages: data?.totalPages ?? 1,
        isLoading,
        isError,
    };
}

// ── Admin Connections ─────────────────────────────────────────────────────────

export function useAdminConnections(filters: AdminConnectionFilters = {}) {
    const { data, isLoading, isError } = useQuery<PaginatedResponse<UserConnectionResponse>>({
        queryKey: ["admin", "networking", "connections", filters],
        queryFn: () =>
            getMyConnections({
                status: filters.status ?? null,
                page: filters.page ?? 1,
                pageSize: filters.pageSize ?? ADMIN_PAGE_SIZE,
            }),
        staleTime: 60 * 1000,
    });

    return {
        connections: data?.items ?? [],
        totalCount: data?.totalCount ?? 0,
        totalPages: data?.totalPages ?? 1,
        isLoading,
        isError,
    };
}

export function useAdminPendingConnections(page = 1) {
    const { data, isLoading } = useQuery<PaginatedResponse<UserConnectionResponse>>({
        queryKey: ["admin", "networking", "pending", page],
        queryFn: () => getPendingRequests({ page, pageSize: ADMIN_PAGE_SIZE }),
        staleTime: 60 * 1000,
    });

    return {
        pending: data?.items ?? [],
        totalCount: data?.totalCount ?? 0,
        totalPages: data?.totalPages ?? 1,
        isLoading,
    };
}

export function useAdminDeleteConnection() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: (id) => deleteConnection(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "networking"] });
            notificationService.success("Conexion eliminada.");
        },
        onError: () => notificationService.error("No se pudo eliminar la conexion."),
    });
}
