"use client";

/**
 * PostDetail — full post view with content, reactions, and inline comments.
 *
 * @module components/features/community/PostDetail
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HtmlViewer } from "@/components/common/HtmlViewer";
import { ReactionButtons } from "@/components/features/community/ReactionButtons";
import { CommentList } from "@/components/features/community/CommentList";
import { CommentInput } from "@/components/features/community/CommentInput";
import { usePostDetail } from "@/hooks/features/community";
import { useReactions } from "@/hooks/features/community";
import { useComments } from "@/hooks/features/community";
import { useAuthStore } from "@/store/auth-store";
import { formatRelativeTime } from "@/lib/formatters";
import { getInitials } from "@/lib/formatters";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pin, MessageCircle } from "lucide-react";

interface PostDetailProps {
    postId: string;
}

export function PostDetail({ postId }: PostDetailProps) {
    const { post, isLoading, isError } = usePostDetail(postId);
    const { user } = useAuthStore();
    const { togglePostReaction, toggleCommentReaction, isPending: isReacting } = useReactions();
    const {
        comments,
        totalCount,
        totalPages,
        page,
        isLoading: isLoadingComments,
        isAdding,
        setPage,
        addComment,
        removeComment,
    } = useComments(postId);

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <LoadingSpinner />
            </div>
        );
    }

    if (isError || !post) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                No se pudo cargar el post.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                        <Avatar className="h-11 w-11 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getInitials(post.authorName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{post.authorName}</span>
                                {post.isPinned && (
                                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                                        <Pin className="h-3 w-3" aria-hidden="true" />
                                        Destacado
                                    </span>
                                )}
                                {post.category && (
                                    <Badge variant="secondary" className="text-xs">
                                        {post.category}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {formatRelativeTime(post.createdAt)}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-3">
                    <h1 className="text-xl font-bold leading-snug">{post.title}</h1>
                    <HtmlViewer html={post.content} />
                </CardContent>

                <CardFooter className="pt-0 flex-col items-start gap-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground w-full">
                        <ReactionButtons
                            likesCount={post.likesCount}
                            dislikesCount={post.dislikesCount}
                            onLike={() => togglePostReaction(post.id, "Like")}
                            onDislike={() => togglePostReaction(post.id, "Dislike")}
                            isPending={isReacting}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground"
                            aria-label={`${totalCount} comentarios`}
                        >
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                            <span className="text-xs">{totalCount} comentarios</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Comments section */}
            <Card>
                <CardContent className="p-0">
                    <CommentList
                        comments={comments}
                        isLoading={isLoadingComments}
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
                    {user && (
                        <>
                            <Separator />
                            <CommentInput
                                onSubmit={(content) => addComment(content)}
                                isPending={isAdding}
                            />
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
