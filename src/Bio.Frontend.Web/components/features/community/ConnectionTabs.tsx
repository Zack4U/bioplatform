"use client";

/**
 * ConnectionTabs — tabs for: Mis Conexiones, Solicitudes Recibidas, Pendientes Enviadas.
 *
 * @module components/features/community/ConnectionTabs
 */

import { EmptyState } from "@/components/common/EmptyState";
import { ConnectionCard } from "@/components/features/community/ConnectionCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useMyConnections,
    usePendingRequests,
    useSentRequests,
    useRespondToRequest,
    useDeleteConnection,
    useCancelRequest,
    useCreateThread,
} from "@/hooks/features/community";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { useRouter } from "next/navigation";
import { useIsMd } from "@/hooks/useMediaQuery";
import type { UserConnectionResponse } from "@/types";
import { Clock, Search, Users } from "lucide-react";
import { useState } from "react";

function ConnectionGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {children}
        </div>
    );
}

function ConnectionSkeletons() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-xl border p-4 space-y-3 flex flex-col items-center"
                >
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ))}
        </div>
    );
}

export function ConnectionTabs() {
    const { user } = useAuthStore();
    const [search, setSearch] = useState("");
    const openChat = useChatStore((s) => s.openChat);
    const router = useRouter();
    const isDesktop = useIsMd();

    const { connections, isLoading: loadingConnections } = useMyConnections();
    const { pending, isLoading: loadingPending } = usePendingRequests();
    const { sent, isLoading: loadingSent } = useSentRequests(user?.id);
    const respondMutation = useRespondToRequest();
    const deleteMutation = useDeleteConnection();
    const cancelMutation = useCancelRequest();
    const createThread = useCreateThread();

    /**
     * Opens a direct chat with the other party of a connection.
     * Calls createThread (idempotent — returns existing thread if already created)
     * to get a real messaging thread ID, then enriches it with the participant name.
     */
    function handleMessage(conn: UserConnectionResponse) {
        const otherId =
            conn.requesterId === user?.id ? conn.addresseeId : conn.requesterId;
        const otherName =
            conn.requesterId === user?.id
                ? conn.addresseeName
                : conn.requesterName;

        createThread.mutate(
            { threadType: "Direct", participantIds: [otherId] },
            {
                onSuccess: (thread) => {
                    if (isDesktop) {
                        openChat({
                            ...thread,
                            otherParticipantId: otherId,
                            otherParticipantName: otherName,
                            title: thread.title ?? otherName,
                        });
                    } else {
                        router.push(`/community/messages/${thread.id}?name=${encodeURIComponent(otherName)}`);
                    }
                },
            },
        );
    }

    const filteredConnections = connections.filter((c) => {
        const name =
            c.requesterId === user?.id ? c.addresseeName : c.requesterName;
        return name.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <Tabs defaultValue="connections">
            <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="connections" id="tab-connections">
                    Mis Conexiones
                    {connections.length > 0 && (
                        <Badge variant="secondary" className="ml-1.5 text-xs">
                            {connections.length}
                        </Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="pending" id="tab-pending">
                    Solicitudes
                    {pending.length > 0 && (
                        <Badge className="ml-1.5 text-xs bg-primary text-primary-foreground">
                            {pending.length}
                        </Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="sent" id="tab-sent">
                    Pendientes
                    {sent.length > 0 && (
                        <Badge
                            variant="outline"
                            className="ml-1.5 text-xs border-amber-400 text-amber-600"
                        >
                            {sent.length}
                        </Badge>
                    )}
                </TabsTrigger>
            </TabsList>

            {/* My Connections */}
            <TabsContent value="connections" className="mt-4 space-y-4">
                <div className="relative">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        id="connections-search"
                        placeholder="Buscar conexiones..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {loadingConnections ? (
                    <ConnectionSkeletons />
                ) : filteredConnections.length === 0 ? (
                    <EmptyState
                        icon={<Users className="h-6 w-6" />}
                        title="Sin conexiones"
                        description={
                            search
                                ? "No se encontraron conexiones con ese nombre."
                                : "Aun no tienes conexiones. Explora sugerencias."
                        }
                    />
                ) : (
                    <ConnectionGrid>
                        {filteredConnections.map((conn) => (
                            <ConnectionCard
                                key={conn.id}
                                connection={conn}
                                actions={["remove", "message"]}
                                onRemove={() => deleteMutation.mutate(conn.id)}
                                onMessage={() => handleMessage(conn)}
                                isPending={deleteMutation.isPending}
                            />
                        ))}
                    </ConnectionGrid>
                )}
            </TabsContent>

            {/* Pending Received Requests */}
            <TabsContent value="pending" className="mt-4">
                {loadingPending ? (
                    <ConnectionSkeletons />
                ) : pending.length === 0 ? (
                    <EmptyState
                        icon={<Users className="h-6 w-6" />}
                        title="Sin solicitudes pendientes"
                        description="No tienes solicitudes de conexion pendientes."
                    />
                ) : (
                    <ConnectionGrid>
                        {pending.map((conn) => (
                            <ConnectionCard
                                key={conn.id}
                                connection={conn}
                                actions={["accept", "reject"]}
                                onAccept={() =>
                                    respondMutation.mutate({
                                        connectionId: conn.id,
                                        action: "Accept",
                                    })
                                }
                                onReject={() =>
                                    respondMutation.mutate({
                                        connectionId: conn.id,
                                        action: "Reject",
                                    })
                                }
                                isPending={respondMutation.isPending}
                            />
                        ))}
                    </ConnectionGrid>
                )}
            </TabsContent>

            {/* Sent Pending Requests */}
            <TabsContent value="sent" className="mt-4 space-y-4">
                {loadingSent ? (
                    <ConnectionSkeletons />
                ) : sent.length === 0 ? (
                    <EmptyState
                        icon={<Clock className="h-6 w-6" />}
                        title="Sin solicitudes enviadas"
                        description="No tienes solicitudes de conexion pendientes de respuesta."
                    />
                ) : (
                    <ConnectionGrid>
                        {sent.map((conn) => (
                            <ConnectionCard
                                key={conn.id}
                                connection={conn}
                                actions={["cancel"]}
                                onCancel={() => cancelMutation.mutate(conn.id)}
                                isPending={cancelMutation.isPending}
                            />
                        ))}
                    </ConnectionGrid>
                )}
            </TabsContent>
        </Tabs>
    );
}
