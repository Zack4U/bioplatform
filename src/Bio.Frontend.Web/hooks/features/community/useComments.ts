/**
 * useComments — paginated comments for a post with CRUD and reactions.
 *
 * Architecture: Hook Pattern §2.2
 *
 * @module hooks/features/community/useComments
 */

"use client";

import {
    createComment,
    deleteComment,
    getComments,
    updateComment,
} from "@/services/community-service";
import { COMMENTS_PAGE_SIZE } from "@/lib/constants";
import { notificationService } from "@/lib/notifications";
import type { CommunityCommentResponse, PaginatedResponse } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function useComments(postId: string) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    // ── Fetch comments ──────────────────────────────────────────────────────

    const { data, isLoading, isError } = useQuery<
        PaginatedResponse<CommunityCommentResponse>
    >({
        queryKey: ["community", "comments", postId, page],
        queryFn: () => getComments(postId, { page, pageSize: COMMENTS_PAGE_SIZE }),
        enabled: !!postId,
        staleTime: 60 * 1000,
    });

    const comments = data?.items ?? [];

    // ── Create comment ──────────────────────────────────────────────────────

    const { mutate: addComment, isPending: isAdding } = useMutation<
        CommunityCommentResponse,
        Error,
        string
    >({
        mutationFn: (content) => createComment(postId, { content }),
        onSuccess: (newComment) => {
            // Optimistically prepend new comment
            queryClient.setQueryData<PaginatedResponse<CommunityCommentResponse>>(
                ["community", "comments", postId, 1],
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        items: [newComment, ...old.items],
                        totalCount: old.totalCount + 1,
                    };
                },
            );
            // Invalidate post to update commentCount
            queryClient.invalidateQueries({ queryKey: ["community", "post", postId] });
            queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
        },
        onError: () => {
            notificationService.error("No se pudo publicar el comentario.");
        },
    });

    // ── Delete comment ──────────────────────────────────────────────────────

    const { mutate: removeComment, isPending: isDeleting } = useMutation<
        void,
        Error,
        string
    >({
        mutationFn: (commentId) => deleteComment(postId, commentId),
        onSuccess: (_, commentId) => {
            queryClient.setQueryData<PaginatedResponse<CommunityCommentResponse>>(
                ["community", "comments", postId, page],
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        items: old.items.filter((c) => c.id !== commentId),
                        totalCount: Math.max(0, old.totalCount - 1),
                    };
                },
            );
            queryClient.invalidateQueries({ queryKey: ["community", "post", postId] });
        },
        onError: () => {
            notificationService.error("No se pudo eliminar el comentario.");
        },
    });

    // ── Update comment ──────────────────────────────────────────────────────

    const { mutate: editComment, isPending: isEditing } = useMutation<
        CommunityCommentResponse,
        Error,
        { commentId: string; content: string }
    >({
        mutationFn: ({ commentId, content }) =>
            updateComment(postId, commentId, { content }),
        onSuccess: (updated) => {
            queryClient.setQueryData<PaginatedResponse<CommunityCommentResponse>>(
                ["community", "comments", postId, page],
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        items: old.items.map((c) =>
                            c.id === updated.id ? updated : c,
                        ),
                    };
                },
            );
        },
        onError: () => {
            notificationService.error("No se pudo actualizar el comentario.");
        },
    });

    return {
        comments,
        totalCount: data?.totalCount ?? 0,
        totalPages: data?.totalPages ?? 1,
        page,
        isLoading,
        isError,
        isAdding,
        isDeleting,
        isEditing,
        setPage,
        addComment,
        removeComment,
        editComment,
    };
}
