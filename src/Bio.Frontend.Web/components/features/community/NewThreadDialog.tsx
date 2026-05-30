"use client";

/**
 * NewThreadDialog — dialog to search and select user for a new conversation.
 *
 * @module components/features/community/NewThreadDialog
 */

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMyConnections, useCreateThread } from "@/hooks/features/community";
import { getInitials } from "@/lib/formatters";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

interface NewThreadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NewThreadDialog({ open, onOpenChange }: NewThreadDialogProps) {
    const { user } = useAuthStore();
    const [search, setSearch] = useState("");
    const { connections } = useMyConnections();
    const createThread = useCreateThread();

    const filtered = connections.filter((c) => {
        const name =
            c.requesterId === user?.id ? c.addresseeName : c.requesterName;
        return name.toLowerCase().includes(search.toLowerCase());
    });

    function handleSelect(targetId: string) {
        createThread.mutate({
            threadType: "Direct",
            participantIds: [targetId],
        });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Nuevo mensaje</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        id="new-thread-search"
                        placeholder="Buscar contacto..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-border/50">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No se encontraron contactos.
                        </p>
                    ) : (
                        filtered.map((conn) => {
                            const name =
                                conn.requesterId === user?.id
                                    ? conn.addresseeName
                                    : conn.requesterName;
                            const targetId =
                                conn.requesterId === user?.id
                                    ? conn.addresseeId
                                    : conn.requesterId;
                            return (
                                <Button
                                    key={conn.id}
                                    variant="ghost"
                                    className="w-full justify-start gap-3 h-auto py-2.5"
                                    onClick={() => handleSelect(targetId)}
                                    disabled={createThread.isPending}
                                >
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                            {getInitials(name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{name}</span>
                                </Button>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
