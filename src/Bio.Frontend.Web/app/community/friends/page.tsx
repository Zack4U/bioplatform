/**
 * Friends / Connections page.
 *
 * @module app/community/friends/page
 */

import { ConnectionTabs } from "@/components/features/community/ConnectionTabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Amigos | BioCommerce Caldas",
    description: "Gestiona tus conexiones, solicitudes de amistad y sugerencias.",
};

export default function FriendsPage() {
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-bold">Amigos y Conexiones</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gestiona tus conexiones con otros miembros de la comunidad.
                </p>
            </div>
            <ConnectionTabs />
        </div>
    );
}
