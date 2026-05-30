"use client";

/**
 * PostCard — displays a single community post in the feed.
 * UI-only — all logic in useCommunityFeed and useReactions hooks.
 *
 * @module components/features/community/PostCard
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactionButtons } from "@/components/features/community/ReactionButtons";
import { formatRelativeTime } from "@/lib/formatters";
import type { CommunityPostListItem } from "@/types";
import { MessageCircle, MoreHorizontal, Pin, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PostCardProps {
    post: CommunityPostListItem;
    currentUserId?: string;
    onLike: (postId: string) => void;
    onDislike: (postId: string) => void;
    onEdit?: (post: CommunityPostListItem) => void;
    onDelete?: (postId: string) => void;
    onOpenComments: (postId: string) => void;
    isReacting?: boolean;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
}

/** Strip HTML tags for content preview */
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function PostCard({
    post,
    currentUserId,
    onLike,
    onDislike,
    onEdit,
    onDelete,
    onOpenComments,
    isReacting,
}: PostCardProps) {
    const isAuthor = currentUserId === post.authorUserId;
    const preview = stripHtml(post.content).slice(0, 180);
    const hasMore = stripHtml(post.content).length > 180;

    return (
        <Card
            className={cn(
                "w-full transition-shadow hover:shadow-md",
                post.isPinned && "border-primary/30 bg-primary/5",
            )}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    {/* Author info */}
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                {getInitials(post.authorName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold leading-none truncate">
                                {post.authorName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {formatRelativeTime(post.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Badges + actions */}
                    <div className="flex items-center gap-2 shrink-0">
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
                        {isAuthor && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        aria-label="Opciones del post"
                                    >
                                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onEdit && (
                                        <DropdownMenuItem
                                            onClick={() => onEdit(post)}
                                            className="gap-2"
                                        >
                                            <Pencil className="h-4 w-4" aria-hidden="true" />
                                            Editar
                                        </DropdownMenuItem>
                                    )}
                                    {onDelete && (
                                        <DropdownMenuItem
                                            onClick={() => onDelete(post.id)}
                                            className="gap-2 text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                                            Eliminar
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pb-3">
                <Link
                    href={`/community/posts/${post.id}`}
                    className="group block space-y-2"
                >
                    <h2 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {preview}
                        {hasMore && (
                            <span className="text-primary font-medium ml-1">
                                Ver mas
                            </span>
                        )}
                    </p>
                </Link>
            </CardContent>

            <CardFooter className="pt-0">
                <div className="flex items-center gap-3 w-full">
                    <ReactionButtons
                        likesCount={post.likesCount}
                        dislikesCount={post.dislikesCount}
                        onLike={() => onLike(post.id)}
                        onDislike={() => onDislike(post.id)}
                        isPending={isReacting}
                    />

                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => onOpenComments(post.id)}
                        aria-label={`Comentarios: ${post.commentCount}`}
                    >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs font-medium">{post.commentCount}</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
