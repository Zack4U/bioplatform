"use client";

/**
 * CommentList — paginated list of comments.
 * UI-only.
 *
 * @module components/features/community/CommentList
 */

import { CommentItem } from "@/components/features/community/CommentItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CommunityCommentResponse } from "@/types";
import { ChevronDown } from "lucide-react";

interface CommentListProps {
    comments: CommunityCommentResponse[];
    isLoading: boolean;
    totalCount: number;
    totalPages: number;
    page: number;
    currentUserId?: string;
    onDelete?: (commentId: string) => void;
    onLike?: (commentId: string) => void;
    onDislike?: (commentId: string) => void;
    onLoadMore: () => void;
    isReacting?: boolean;
}

function CommentSkeleton() {
    return (
        <div className="flex gap-2.5 py-2">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-3 w-24" />
            </div>
        </div>
    );
}

export function CommentList({
    comments,
    isLoading,
    totalCount,
    totalPages,
    page,
    currentUserId,
    onDelete,
    onLike,
    onDislike,
    onLoadMore,
    isReacting,
}: CommentListProps) {
    if (isLoading) {
        return (
            <div className="divide-y divide-border/50 px-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <CommentSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (comments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <p className="text-sm font-medium text-muted-foreground">
                    No hay comentarios aun
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Se el primero en comentar.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <p className="text-xs text-muted-foreground px-3 py-2 font-medium">
                {totalCount} {totalCount === 1 ? "comentario" : "comentarios"}
            </p>
            <div className="divide-y divide-border/30 px-3">
                {comments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        currentUserId={currentUserId}
                        onDelete={onDelete}
                        onLike={onLike}
                        onDislike={onDislike}
                        isReacting={isReacting}
                    />
                ))}
            </div>
            {page < totalPages && (
                <div className="flex justify-center py-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLoadMore}
                        className="gap-1.5 text-xs text-muted-foreground"
                    >
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        Cargar mas comentarios
                    </Button>
                </div>
            )}
        </div>
    );
}
