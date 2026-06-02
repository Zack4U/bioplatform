"use client";

/**
 * CreatePostButton — "What's on your mind?" prompt that opens create post form.
 * Desktop: opens Dialog. Mobile: navigates to /community/posts/create.
 * UI-only.
 *
 * @module components/features/community/CreatePostButton
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/formatters";
import { useAuthStore } from "@/store/auth-store";
import { useIsMd } from "@/hooks/useMediaQuery";
import { PenLine } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreatePostButtonProps {
    onOpenDialog?: () => void;
}

export function CreatePostButton({ onOpenDialog }: CreatePostButtonProps) {
    const { user, isAuthenticated } = useAuthStore();
    const isDesktop = useIsMd();
    const router = useRouter();

    if (!isAuthenticated || !user) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        <Button
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => router.push("/login")}
                        >
                            Inicia sesion
                        </Button>
                        {" "}para publicar en la comunidad.
                    </p>
                </CardContent>
            </Card>
        );
    }

    function handleClick() {
        if (isDesktop) {
            onOpenDialog?.();
        } else {
            router.push("/community/posts/create");
        }
    }

    return (
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={handleClick}>
            <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                            {getInitials(user.fullName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 rounded-full border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
                        En que estas pensando, {user.fullName.split(" ")[0]}?
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" aria-label="Crear publicacion">
                        <PenLine className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
