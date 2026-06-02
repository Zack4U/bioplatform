"use client";

/**
 * ConnectionCard — user card with avatar, name, and action button.
 * UI-only.
 *
 * @module components/features/community/ConnectionCard
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/formatters";
import { useAuthStore } from "@/store/auth-store";
import type { UserConnectionResponse } from "@/types";
import { Clock, MessageCircle, UserCheck, UserPlus, UserX } from "lucide-react";

type ConnectionCardAction =
    | "connect"
    | "accept"
    | "reject"
    | "remove"
    | "message"
    | "cancel";

interface ConnectionCardProps {
    connection: UserConnectionResponse;
    actions?: ConnectionCardAction[];
    onConnect?: () => void;
    onAccept?: () => void;
    onReject?: () => void;
    onRemove?: () => void;
    onMessage?: () => void;
    onCancel?: () => void;
    isPending?: boolean;
}

export function ConnectionCard({
    connection,
    actions = [],
    onConnect,
    onAccept,
    onReject,
    onRemove,
    onMessage,
    onCancel,
    isPending,
}: ConnectionCardProps) {
    const { user } = useAuthStore();

    const displayName =
        connection.requesterId === user?.id
            ? connection.addresseeName
            : connection.requesterName;

    return (
        <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
                <div className="flex flex-col items-center gap-3 text-center">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                            {getInitials(displayName)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 w-full">
                        <p className="font-semibold text-sm truncate">
                            {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Miembro de BioCommerce
                        </p>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-center w-full">
                        {actions.includes("connect") && (
                            <Button
                                size="sm"
                                className="flex-1 gap-1.5"
                                onClick={onConnect}
                                disabled={isPending}
                            >
                                <UserPlus
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                                Conectar
                            </Button>
                        )}
                        {actions.includes("accept") && (
                            <Button
                                size="sm"
                                className="flex-1 gap-1.5"
                                onClick={onAccept}
                                disabled={isPending}
                            >
                                <UserCheck
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                                Aceptar
                            </Button>
                        )}
                        {actions.includes("reject") && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1.5"
                                onClick={onReject}
                                disabled={isPending}
                            >
                                <UserX
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                                Rechazar
                            </Button>
                        )}
                        {actions.includes("remove") && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                                onClick={onRemove}
                                disabled={isPending}
                            >
                                <UserX
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                                Eliminar
                            </Button>
                        )}
                        {actions.includes("message") && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1.5"
                                onClick={onMessage}
                                disabled={isPending}
                            >
                                <MessageCircle
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                                Mensaje
                            </Button>
                        )}
                        {actions.includes("cancel") && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                                onClick={onCancel}
                                disabled={isPending}
                            >
                                <Clock
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                                Cancelar
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
