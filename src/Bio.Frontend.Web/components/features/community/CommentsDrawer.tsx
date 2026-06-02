"use client";

/**
 * CommentsDrawer — bottom sheet for comments on mobile (Shadcn Drawer).
 * Snap points at 50% and 90% of screen height.
 *
 * @module components/features/community/CommentsDrawer
 */

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { CommentList } from "@/components/features/community/CommentList";
import { CommentInput } from "@/components/features/community/CommentInput";
import { useComments } from "@/hooks/features/community";
import { useReactions } from "@/hooks/features/community";
import { useAuthStore } from "@/store/auth-store";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentsDrawerProps {
    postId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommentsDrawer({ postId, open, onOpenChange }: CommentsDrawerProps) {
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
        <Drawer open={open} onOpenChange={onOpenChange} snapPoints={[0.5, 0.9]}>
            <DrawerContent className="flex flex-col max-h-[90vh]">
                <DrawerHeader className="flex items-center justify-between py-3 px-4 border-b shrink-0">
                    <DrawerTitle className="text-base">
                        Comentarios ({totalCount})
                    </DrawerTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        aria-label="Cerrar comentarios"
                        className="h-8 w-8"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </DrawerHeader>

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
                        onDislike={user ? (id) => toggleCommentReaction(id, "Dislike") : undefined}
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
            </DrawerContent>
        </Drawer>
    );
}
