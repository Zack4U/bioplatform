"use client";

/**
 * AuthGuard — client-side route protection component.
 *
 * Wraps protected pages to enforce authentication and role checks.
 * Since tokens live in localStorage (not cookies), we can't use
 * Next.js Edge Middleware for auth — we protect client-side instead.
 *
 * @module components/common/AuthGuard
 */

import { useAuthStore } from "@/store/auth-store";
import type { UserRoleName } from "@/types";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
    children: React.ReactNode;
    /** If specified, user must have at least one of these roles */
    requiredRoles?: UserRoleName[];
}

export function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Preserve where the user was headed so login can return them there.
            const returnUrl =
                typeof window !== "undefined"
                    ? window.location.pathname + window.location.search
                    : "/";
            router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        }
    }, [isLoading, isAuthenticated, router]);

    // Still loading — show spinner
    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2
                    className="h-8 w-8 animate-spin text-muted-foreground"
                    aria-label="Cargando"
                />
            </div>
        );
    }

    // Not authenticated — will redirect via the effect above
    if (!isAuthenticated) {
        return null;
    }

    // Role check — if requiredRoles specified, user must have at least one
    if (requiredRoles && requiredRoles.length > 0) {
        const userRoles = user?.roles ?? [];
        const hasAccess = requiredRoles.some((role) =>
            userRoles.includes(role),
        );

        if (!hasAccess) {
            return (
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldAlert
                            className="h-8 w-8 text-destructive"
                            aria-hidden="true"
                        />
                    </div>
                    <h2 className="text-xl font-semibold">
                        Acceso denegado
                    </h2>
                    <p className="max-w-md text-muted-foreground">
                        No tienes los permisos necesarios para acceder a
                        esta seccion. Contacta al administrador si crees
                        que esto es un error.
                    </p>
                </div>
            );
        }
    }

    return <>{children}</>;
}
