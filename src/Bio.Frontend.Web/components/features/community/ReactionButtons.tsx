"use client";

/**
 * ReactionButtons — Like / Dislike buttons with counts and micro-animation.
 * UI-only — receives counts and callbacks as props.
 *
 * @module components/features/community/ReactionButtons
 */

import { Button } from "@/components/ui/button";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReactionButtonsProps {
    likesCount: number;
    dislikesCount: number;
    userReaction?: "Like" | "Dislike" | null;
    onLike: () => void;
    onDislike: () => void;
    isPending?: boolean;
    size?: "sm" | "default";
}

export function ReactionButtons({
    likesCount,
    dislikesCount,
    userReaction,
    onLike,
    onDislike,
    isPending,
    size = "sm",
}: ReactionButtonsProps) {
    const [animating, setAnimating] = useState<"like" | "dislike" | null>(null);

    function handleLike() {
        setAnimating("like");
        setTimeout(() => setAnimating(null), 300);
        onLike();
    }

    function handleDislike() {
        setAnimating("dislike");
        setTimeout(() => setAnimating(null), 300);
        onDislike();
    }

    return (
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size={size}
                className={cn(
                    "gap-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all",
                    userReaction === "Like" && "text-primary bg-primary/10",
                    animating === "like" && "scale-125",
                )}
                onClick={handleLike}
                disabled={isPending}
                aria-label={`Me gusta: ${likesCount}`}
            >
                <ThumbsUp
                    className={cn(
                        "h-4 w-4 transition-transform",
                        animating === "like" && "scale-125",
                    )}
                    aria-hidden="true"
                />
                <span className="text-xs font-medium">{likesCount}</span>
            </Button>

            <Button
                variant="ghost"
                size={size}
                className={cn(
                    "gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
                    userReaction === "Dislike" && "text-destructive bg-destructive/10",
                    animating === "dislike" && "scale-125",
                )}
                onClick={handleDislike}
                disabled={isPending}
                aria-label={`No me gusta: ${dislikesCount}`}
            >
                <ThumbsDown
                    className={cn(
                        "h-4 w-4 transition-transform",
                        animating === "dislike" && "scale-125",
                    )}
                    aria-hidden="true"
                />
                <span className="text-xs font-medium">{dislikesCount}</span>
            </Button>
        </div>
    );
}
