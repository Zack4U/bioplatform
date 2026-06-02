"use client";

/**
 * Community main page — feed with category filter, create post, and reactions.
 *
 * @module app/community/page
 */

import { CategoryTabs } from "@/components/features/community/CategoryTabs";
import { CreatePostButton } from "@/components/features/community/CreatePostButton";
import { PostFeed } from "@/components/features/community/PostFeed";
import { PostFormDialog } from "@/components/features/community/PostFormDialog";
import { CommentsDrawer } from "@/components/features/community/CommentsDrawer";
import { CommentsDialog } from "@/components/features/community/CommentsDialog";
import { useCommunityFeed } from "@/hooks/features/community";
import { useReactions } from "@/hooks/features/community";
import { useAuthStore } from "@/store/auth-store";
import { useIsMd } from "@/hooks/useMediaQuery";
import { deletePost } from "@/services/community-service";
import { notificationService } from "@/lib/notifications";
import type { CommunityPostListItem } from "@/types";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CommunityPage() {
    const { user, isAuthenticated } = useAuthStore();
    const isDesktop = useIsMd();
    const router = useRouter();
    const searchParams = useSearchParams();

    const {
        posts,
        category,
        isLoading,
        isError,
        handleCategoryChange,
        invalidateFeed,
    } = useCommunityFeed();

    const { togglePostReaction, isPending: isReacting } = useReactions();

    // 'Mis Posts' tab: filter by current user client-side when ?tab=mine
    const showMine = searchParams.get("tab") === "mine";
    const displayPosts = showMine ? posts.filter((p) => p.authorUserId === user?.id) : posts;

    // Auth guard — redirect unauthenticated users to profile (login) page
    function requireAuth(action: () => void) {
        if (!isAuthenticated) {
            router.push("/profile");
            return;
        }
        action();
    }

    // Create/Edit dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<CommunityPostListItem | null>(null);

    // Comments
    const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
    const [commentsOpen, setCommentsOpen] = useState(false);

    function handleOpenComments(postId: string) {
        setCommentsPostId(postId);
        setCommentsOpen(true);
    }

    function handleEdit(post: CommunityPostListItem) {
        setEditingPost(post);
        setCreateDialogOpen(true);
    }

    async function handleDelete(postId: string) {
        try {
            await deletePost(postId);
            invalidateFeed();
            notificationService.success("Post eliminado correctamente.");
        } catch {
            notificationService.error("No se pudo eliminar el post.");
        }
    }

    return (
        <div className="space-y-4">
            {/* Create post */}
            {isAuthenticated && (
                <CreatePostButton onOpenDialog={() => setCreateDialogOpen(true)} />
            )}

            {/* Category tabs */}
            <CategoryTabs
                activeCategory={category}
                onCategoryChange={handleCategoryChange}
            />

            {/* Feed */}
            <PostFeed
                posts={displayPosts}
                isLoading={isLoading}
                isError={isError}
                currentUserId={user?.id}
                onLike={(postId) => requireAuth(() => togglePostReaction(postId, "Like"))}
                onDislike={(postId) => requireAuth(() => togglePostReaction(postId, "Dislike"))}
                onEdit={isAuthenticated ? handleEdit : undefined}
                onDelete={isAuthenticated ? handleDelete : undefined}
                onOpenComments={handleOpenComments}
                isReacting={isReacting}
            />

            {/* Create/Edit Dialog (desktop) */}
            {isDesktop && (
                <PostFormDialog
                    open={createDialogOpen}
                    onOpenChange={(open) => {
                        setCreateDialogOpen(open);
                        if (!open) setEditingPost(null);
                    }}
                    editPost={editingPost}
                />
            )}

            {/* Comments — Drawer (mobile) / Dialog (desktop) */}
            {isDesktop ? (
                <CommentsDialog
                    postId={commentsPostId}
                    open={commentsOpen}
                    onOpenChange={setCommentsOpen}
                />
            ) : (
                <CommentsDrawer
                    postId={commentsPostId}
                    open={commentsOpen}
                    onOpenChange={setCommentsOpen}
                />
            )}
        </div>
    );
}
