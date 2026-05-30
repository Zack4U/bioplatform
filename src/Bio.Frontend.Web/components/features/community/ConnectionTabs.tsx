"use client";

/**
 * ConnectionTabs — 3 tabs for connections, pending requests, and suggestions.
 *
 * @module components/features/community/ConnectionTabs
 */

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { ConnectionCard } from "@/components/features/community/ConnectionCard";
import {
    useMyConnections,
    usePendingRequests,
    useRespondToRequest,
    useDeleteConnection,
    useSendConnectionRequest,
} from "@/hooks/features/community";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import type { UserConnectionResponse } from "@/types";
import { Users, Search } from "lucide-react";
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
                <div key={i} className="rounded-xl border p-4 space-y-3 flex flex-col items-center">
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

    const { connections, isLoading: loadingConnections } = useMyConnections();
    const { pending, isLoading: loadingPending } = usePendingRequests();
    const respondMutation = useRespondToRequest();
    const deleteMutation = useDeleteConnection();
    const sendMutation = useSendConnectionRequest();

    function handleMessage(conn: UserConnectionResponse) {
        const otherId = conn.requesterId === user?.id ? conn.addresseeId : conn.requesterId;
        const otherName = conn.requesterId === user?.id ? conn.addresseeName : conn.requesterName;
        openChat({
            id: conn.id,
            title: otherName,
            threadType: "Direct",
            participantCount: 2,
            unreadCount: 0,
            createdAt: conn.createdAt,
            updatedAt: null,
            otherParticipantName: otherName,
            otherParticipantId: otherId,
        });
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
                <TabsTrigger value="suggestions" id="tab-suggestions">
                    Sugerencias
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

            {/* Pending Requests */}
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

            {/* Suggestions — placeholder */}
            <TabsContent value="suggestions" className="mt-4">
                <EmptyState
                    icon={<Users className="h-6 w-6" />}
                    title="Sugerencias de conexion"
                    description="Proximamente podras ver sugerencias de personas para conectar."
                />
            </TabsContent>
        </Tabs>
    );
}
