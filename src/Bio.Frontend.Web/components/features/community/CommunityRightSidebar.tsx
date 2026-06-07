"use client";

/**
 * CommunityRightSidebar — right panel with contacts, pending requests, and suggestions.
 *
 * @module components/features/community/CommunityRightSidebar
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/formatters";
import {
    useMyConnections,
    usePendingRequests,
    useSendConnectionRequest,
} from "@/hooks/features/community";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import type { UserConnectionResponse } from "@/types";
import { MessageCircle, UserPlus } from "lucide-react";

function ContactItem({ connection, onMessage }: { connection: UserConnectionResponse; onMessage: () => void }) {
    const name =
        connection.requesterName === useAuthStore.getState().user?.fullName
            ? connection.addresseeName
            : connection.requesterName;

    return (
        <div className="flex items-center gap-2.5 py-1.5 group">
            <div className="relative">
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(name)}
                    </AvatarFallback>
                </Avatar>
                <span
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background"
                    aria-hidden="true"
                />
            </div>
            <span className="flex-1 text-sm truncate font-medium">{name}</span>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onMessage}
                aria-label={`Enviar mensaje a ${name}`}
            >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
        </div>
    );
}

export function CommunityRightSidebar() {
    const { user, isAuthenticated } = useAuthStore();
    const openChat = useChatStore((s) => s.openChat);
    const sendRequest = useSendConnectionRequest();

    const { connections, isLoading: loadingConnections } = useMyConnections({ pageSize: 8 });
    const { pending } = usePendingRequests();

    if (!isAuthenticated) return null;

    function handleOpenChat(connection: UserConnectionResponse) {
        const otherId =
            connection.requesterId === user?.id
                ? connection.addresseeId
                : connection.requesterId;
        const otherName =
            connection.requesterId === user?.id
                ? connection.addresseeName
                : connection.requesterName;

        // Open chat popup with a thread summary shape
        openChat({
            id: connection.id,
            title: otherName,
            threadType: "Direct",
            participantCount: 2,
            unreadCount: 0,
            createdAt: connection.createdAt,
            updatedAt: null,
            otherParticipantName: otherName,
            otherParticipantId: otherId,
        });
    }

    return (
        <aside
            className="space-y-3 sticky top-20 self-start"
            aria-label="Panel lateral de comunidad"
        >
            {/* Pending requests badge */}
            {pending.length > 0 && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Solicitudes de amistad</p>
                            <Badge className="bg-primary text-primary-foreground">
                                {pending.length}
                            </Badge>
                        </div>
                        <Button
                            variant="link"
                            className="p-0 h-auto text-xs mt-1"
                            asChild
                        >
                            <a href="/community/friends">Ver solicitudes</a>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Contacts online */}
            <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Contactos ({connections.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                    {loadingConnections ? (
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-3.5 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : connections.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground mb-2">
                                Aun no tienes conexiones
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs"
                                onClick={() =>
                                    sendRequest.mutate({ addresseeId: "", message: null })
                                }
                                asChild
                            >
                                <a href="/community/friends">
                                    <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                                    Conectar con alguien
                                </a>
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {connections.map((conn) => (
                                <ContactItem
                                    key={conn.id}
                                    connection={conn}
                                    onMessage={() => handleOpenChat(conn)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </aside>
    );
}
