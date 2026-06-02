"use client";

/**
 * ConnectionsManagement — admin table for user connections.
 *
 * @module components/features/admin/connections/ConnectionsManagement
 */

import { StatusBadge } from "@/components/common";
import {
    AdminDataTable,
    type ColumnDef,
    type RowAction,
} from "@/components/features/admin/shared/AdminDataTable";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useAdminConnections,
    useAdminDeleteConnection,
} from "@/hooks/features/admin/useAdminCommunity";
import type { ConnectionStatus, UserConnectionResponse } from "@/types";
import { Trash2, Users } from "lucide-react";
import { useState } from "react";

type BadgeVariant = "success" | "warning" | "destructive" | "info" | "default" | "outline";

function getConnectionStatusVariant(status: string): BadgeVariant {
    switch (status) {
        case "Accepted":
            return "success";
        case "Pending":
            return "warning";
        case "Rejected":
            return "outline";
        case "Blocked":
            return "destructive";
        default:
            return "outline";
    }
}

const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
    Pending: "Pendiente",
    Accepted: "Aceptada",
    Rejected: "Rechazada",
    Blocked: "Bloqueada",
};

const columns: ColumnDef<UserConnectionResponse>[] = [
    {
        key: "requesterName",
        header: "Solicitante",
        sortable: true,
        render: (c) => <span className="font-medium text-sm">{c.requesterName}</span>,
    },
    {
        key: "addresseeName",
        header: "Destinatario",
        sortable: true,
        render: (c) => <span className="text-sm">{c.addresseeName}</span>,
    },
    {
        key: "status",
        header: "Estado",
        render: (c) => (
            <StatusBadge
                label={CONNECTION_STATUS_LABELS[c.status] ?? c.status}
                variant={getConnectionStatusVariant(c.status)}
            />
        ),
    },
    {
        key: "message",
        header: "Mensaje",
        hideOnMobile: true,
        render: (c) => (
            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                {c.message ?? "—"}
            </p>
        ),
    },
    {
        key: "createdAt",
        header: "Fecha",
        hideOnMobile: true,
        sortable: true,
        render: (c) => (
            <span className="text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString("es-CO")}
            </span>
        ),
    },
];

export function ConnectionsManagement() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const { connections, totalPages, isLoading } = useAdminConnections({
        status:
            statusFilter && statusFilter !== "all"
                ? (statusFilter as ConnectionStatus)
                : undefined,
        page,
        pageSize: 15,
    });

    const deleteConnection = useAdminDeleteConnection();

    const handleSort = (key: string) => {
        setSortBy((p) => {
            if (p === key) {
                setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
                return p;
            }
            setSortOrder("asc");
            return key;
        });
    };

    const actions: RowAction<UserConnectionResponse>[] = [
        {
            label: "Eliminar conexion",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive" as const,
            onClick: (c) => deleteConnection.mutate(c.id),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Gestion de Conexiones
                </h1>
                <p className="text-muted-foreground">
                    Administra las conexiones entre usuarios de la plataforma
                </p>
            </div>

            <AdminDataTable
                data={connections}
                columns={columns}
                actions={actions}
                keyExtractor={(c) => c.id}
                isLoading={isLoading}
                searchValue={search}
                onSearchChange={(v) => {
                    setSearch(v);
                    setPage(1);
                }}
                searchPlaceholder="Buscar por nombre..."
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                emptyTitle="No hay conexiones"
                emptyIcon={<Users className="h-6 w-6" />}
                toolbar={
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                            setStatusFilter(v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {Object.entries(CONNECTION_STATUS_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>
                                    {v}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                }
            />
        </div>
    );
}
