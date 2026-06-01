"use client";

/**
 * Friends / Connections page — requires authentication.
 *
 * @module app/community/friends/page
 */

import { ConnectionTabs } from "@/components/features/community/ConnectionTabs";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function FriendsPage() {
    return (
        <AuthGuard>
            <div className="space-y-4">
                <div>
                    <h1 className="text-xl font-bold">Amigos y Conexiones</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gestiona tus conexiones con otros miembros de la comunidad.
                    </p>
                </div>
                <ConnectionTabs />
            </div>
        </AuthGuard>
    );
}
