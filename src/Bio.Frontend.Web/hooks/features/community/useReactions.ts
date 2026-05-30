/**
 * useReactions — toggle Like/Dislike on posts or comments with optimistic updates.
 *
 * Architecture: Hook Pattern §2.2
 *
 * @module hooks/features/community/useReactions
 */

"use client";

import { toggleReaction } from "@/services/community-service";
import type {
    CommunityPostListItem,
    CommunityReactionResult,
    CommunityReactionToggleDTO,
    PaginatedResponse,
    ReactionTargetType,
    ReactionType,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useReactions() {
    const queryClient = useQueryClient();

    const { mutate: react, isPending } = useMutation<
        CommunityReactionResult,
        Error,
        CommunityReactionToggleDTO
    >({
        mutationFn: (dto) => toggleReaction(dto),
        onMutate: async (dto) => {
            // Optimistic update for post list items
            if (dto.targetType === "Post") {
                const keys = queryClient.getQueriesData<PaginatedResponse<CommunityPostListItem>>(
                    { queryKey: ["community", "posts"] },
                );
                keys.forEach(([key, old]) => {
                    if (!old) return;
                    queryClient.setQueryData<PaginatedResponse<CommunityPostListItem>>(key, {
                        ...old,
                        items: old.items.map((p) => {
                            if (p.id !== dto.targetId) return p;
                            const isCurrentlyLiked =
                                dto.reactionType === "Like" && p.likesCount > 0;
                            const isCurrentlyDisliked =
                                dto.reactionType === "Dislike" && p.dislikesCount > 0;
                            return {
                                ...p,
                                likesCount:
                                    dto.reactionType === "Like"
                                        ? isCurrentlyLiked
                                            ? p.likesCount - 1
                                            : p.likesCount + 1
                                        : p.likesCount,
                                dislikesCount:
                                    dto.reactionType === "Dislike"
                                        ? isCurrentlyDisliked
                                            ? p.dislikesCount - 1
                                            : p.dislikesCount + 1
                                        : p.dislikesCount,
                            };
                        }),
                    });
                });
            }
        },
        onSuccess: (result, dto) => {
            // Sync authoritative counts from server
            if (dto.targetType === "Post") {
                const keys = queryClient.getQueriesData<PaginatedResponse<CommunityPostListItem>>(
                    { queryKey: ["community", "posts"] },
                );
                keys.forEach(([key, old]) => {
                    if (!old) return;
                    queryClient.setQueryData<PaginatedResponse<CommunityPostListItem>>(key, {
                        ...old,
                        items: old.items.map((p) =>
                            p.id === dto.targetId
                                ? {
                                      ...p,
                                      likesCount: result.likesCount,
                                      dislikesCount: result.dislikesCount,
                                  }
                                : p,
                        ),
                    });
                });
                // Also update detail cache
                queryClient.setQueryData(
                    ["community", "post", dto.targetId],
                    (old: CommunityPostListItem | undefined) =>
                        old
                            ? {
                                  ...old,
                                  likesCount: result.likesCount,
                                  dislikesCount: result.dislikesCount,
                              }
                            : old,
                );
            }
        },
    });

    function togglePostReaction(postId: string, reactionType: ReactionType) {
        react({ targetType: "Post" as ReactionTargetType, targetId: postId, reactionType });
    }

    function toggleCommentReaction(commentId: string, reactionType: ReactionType) {
        react({
            targetType: "Comment" as ReactionTargetType,
            targetId: commentId,
            reactionType,
        });
    }

    return { togglePostReaction, toggleCommentReaction, isPending };
}
