"use client";

/**
 * CommentsDialog — dialog for comments on desktop.
 *
 * @module components/features/community/CommentsDialog
 */

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CommentList } from "@/components/features/community/CommentList";
import { CommentInput } from "@/components/features/community/CommentInput";
import { useComments } from "@/hooks/features/community";
import { useReactions } from "@/hooks/features/community";
import { useAuthStore } from "@/store/auth-store";

interface CommentsDialogProps {
    postId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommentsDialog({ postId, open, onOpenChange }: CommentsDialogProps) {
    const { user } = useAuthStore();
    const { toggleCommentReaction, isPending: isReacting } = useReactions();

    const {
        comments,
        totalCount,
        totalPages,
        page,
        isLoading,
        isAdding,
        setPage,
        addComment,
        removeComment,
    } = useComments(postId ?? "");

    if (!postId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col gap-0 max-w-lg h-[70vh] p-0">
                <DialogHeader className="px-4 py-3 border-b shrink-0">
                    <DialogTitle className="text-base">
                        Comentarios ({totalCount})
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto overscroll-contain">
                    <CommentList
                        comments={comments}
                        isLoading={isLoading}
                        totalCount={totalCount}
                        totalPages={totalPages}
                        page={page}
                        currentUserId={user?.id}
                        onDelete={user ? (id) => removeComment(id) : undefined}
                        onLike={user ? (id) => toggleCommentReaction(id, "Like") : undefined}
                        onDislike={
                            user ? (id) => toggleCommentReaction(id, "Dislike") : undefined
                        }
                        onLoadMore={() => setPage(page + 1)}
                        isReacting={isReacting}
                    />
                </div>

                {user && (
                    <div className="shrink-0">
                        <CommentInput
                            onSubmit={(content) => addComment(content)}
                            isPending={isAdding}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
