"use client";

/**
 * CommentItem — displays a single comment with author, reactions, and actions.
 * UI-only.
 *
 * @module components/features/community/CommentItem
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ReactionButtons } from "@/components/features/community/ReactionButtons";
import { formatRelativeTime } from "@/lib/formatters";
import type { CommunityCommentResponse } from "@/types";
import { Trash2 } from "lucide-react";
import { getInitials } from "@/lib/formatters";

interface CommentItemProps {
    comment: CommunityCommentResponse;
    currentUserId?: string;
    onDelete?: (commentId: string) => void;
    onLike?: (commentId: string) => void;
    onDislike?: (commentId: string) => void;
    isReacting?: boolean;
}

export function CommentItem({
    comment,
    currentUserId,
    onDelete,
    onLike,
    onDislike,
    isReacting,
}: CommentItemProps) {
    const isAuthor = currentUserId === comment.authorUserId;

    if (comment.isDeleted) {
        return (
            <div className="flex gap-2.5 py-2">
                <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                <p className="text-sm text-muted-foreground italic pt-1">
                    [Comentario eliminado]
                </p>
            </div>
        );
    }

    return (
        <div className="flex gap-2.5 py-2 group">
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(comment.authorName)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="bg-muted rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold leading-none mb-1">
                        {comment.authorName}
                    </p>
                    <p className="text-sm leading-relaxed break-words">
                        {comment.content}
                    </p>
                </div>

                <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.createdAt)}
                    </span>

                    {onLike && onDislike && (
                        <ReactionButtons
                            likesCount={comment.likesCount}
                            dislikesCount={comment.dislikesCount}
                            onLike={() => onLike(comment.id)}
                            onDislike={() => onDislike(comment.id)}
                            isPending={isReacting}
                            size="sm"
                        />
                    )}

                    {isAuthor && onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete(comment.id)}
                            aria-label="Eliminar comentario"
                        >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
