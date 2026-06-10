"use client";

/**
 * PostFeed — renders list of PostCards with loading skeletons and empty state.
 * UI-only.
 *
 * @module components/features/community/PostFeed
 */

import { PostCard } from "@/components/features/community/PostCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CommunityPostListItem } from "@/types";
import { FileText } from "lucide-react";

interface PostFeedProps {
    posts: CommunityPostListItem[];
    isLoading: boolean;
    isError: boolean;
    currentUserId?: string;
    onLike: (postId: string) => void;
    onDislike: (postId: string) => void;
    onEdit?: (post: CommunityPostListItem) => void;
    onDelete?: (postId: string) => void;
    onOpenComments: (postId: string) => void;
    isReacting?: boolean;
}

function PostSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <div className="flex gap-3 pt-1">
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-7 w-16" />
                </div>
            </CardContent>
        </Card>
    );
}

export function PostFeed({
    posts,
    isLoading,
    isError,
    currentUserId,
    onLike,
    onDislike,
    onEdit,
    onDelete,
    onOpenComments,
    isReacting,
}: PostFeedProps) {
    if (isLoading) {
        return (
            <div className="space-y-4" aria-busy="true" aria-label="Cargando posts">
                {Array.from({ length: 4 }).map((_, i) => (
                    <PostSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <EmptyState
                icon={<FileText className="h-6 w-6" />}
                title="Error al cargar los posts"
                description="No se pudo cargar el feed. Intenta de nuevo."
            />
        );
    }

    if (posts.length === 0) {
        return (
            <EmptyState
                icon={<FileText className="h-6 w-6" />}
                title="No hay publicaciones"
                description="Se el primero en publicar algo en esta categoria."
            />
        );
    }

    return (
        <div className="space-y-4" role="feed" aria-label="Feed de comunidad">
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onLike={onLike}
                    onDislike={onDislike}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onOpenComments={onOpenComments}
                    isReacting={isReacting}
                />
            ))}
        </div>
    );
}
