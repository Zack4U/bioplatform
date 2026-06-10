"use client";

import { useAuthStore } from "@/store/auth-store";
import type { UserRoleName } from "@/types";
import { ShieldAlert } from "lucide-react";

interface PageRoleGuardProps {
    children: React.ReactNode;
    requiredRoles: UserRoleName[];
}

/**
 * Client-side per-page role gate.
 * Renders an access-denied message when the authenticated user lacks all required roles.
 * Complements the layout-level AuthGuard which only checks authenticated status.
 */
export function PageRoleGuard({ children, requiredRoles }: PageRoleGuardProps) {
    const { user } = useAuthStore();
    const userRoles = user?.roles ?? [];
    const hasAccess = requiredRoles.some((r) => userRoles.includes(r));

    if (!hasAccess) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <ShieldAlert className="h-8 w-8 text-destructive" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-semibold">Acceso denegado</h2>
                <p className="max-w-md text-muted-foreground">
                    No tienes los permisos necesarios para acceder a esta seccion.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
