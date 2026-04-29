"use client";

/**
 * AuditLogManagement — audit trail viewer for platform administrators.
 * Shows a chronological log of all administrative actions.
 */

import { AdminDataTable, type ColumnDef } from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { mockAuditLog } from "@/lib/admin-mock";
import type { AuditLogEntry } from "@/types";
import { ClipboardList, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/** Action key → Spanish label */
const ACTION_LABELS: Record<string, string> = {
    "user.login": "Inicio de Sesion",
    "user.login_failed": "Inicio Fallido",
    "user.role_changed": "Cambio de Rol",
    "user.deactivated": "Cuenta Desactivada",
    "species.created": "Especie Creada",
    "image.validated": "Imagen Validada",
    "product.updated": "Producto Actualizado",
    "permit.approved": "Permiso Aprobado",
    "order.status_changed": "Estado de Orden",
    "review.flagged": "Resena Reportada",
    "model.deployed": "Modelo Desplegado",
    "request.approved": "Solicitud Aprobada",
};

/** Entity type → Spanish label */
const ENTITY_LABELS: Record<string, string> = {
    User: "Usuario",
    Species: "Especie",
    Image: "Imagen",
    Product: "Producto",
    Permit: "Permiso",
    Order: "Orden",
    Review: "Resena",
    AiModel: "Modelo IA",
    Request: "Solicitud",
};

/** Action → badge variant */
const ACTION_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    "user.login": "secondary",
    "user.login_failed": "destructive",
    "user.deactivated": "destructive",
    "review.flagged": "destructive",
    "permit.approved": "default",
    "request.approved": "default",
    "model.deployed": "default",
};

const columns: ColumnDef<AuditLogEntry>[] = [
    {
        key: "createdAt", header: "Fecha", sortable: true,
        render: (e) => (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(e.createdAt).toLocaleString("es-CO", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })}
            </span>
        ),
    },
    {
        key: "action", header: "Accion",
        render: (e) => (
            <Badge variant={ACTION_VARIANTS[e.action] ?? "outline"}>
                {ACTION_LABELS[e.action] ?? e.action}
            </Badge>
        ),
    },
    {
        key: "entityType", header: "Entidad",
        render: (e) => (
            <span className="text-sm">
                <span className="text-muted-foreground">{ENTITY_LABELS[e.entityType] ?? e.entityType}:</span>{" "}
                <span className="font-medium">{e.entityName}</span>
            </span>
        ),
    },
    {
        key: "performedByName", header: "Realizado por",
        render: (e) => <span className="font-medium">{e.performedByName}</span>,
    },
    {
        key: "ipAddress", header: "IP", hideOnMobile: true,
        render: (e) => <span className="font-mono text-xs text-muted-foreground">{e.ipAddress ?? "-"}</span>,
    },
    {
        key: "details", header: "Detalles", hideOnMobile: true,
        render: (e) => (
            <span className="truncate max-w-[200px] inline-block text-sm text-muted-foreground">
                {e.details ?? "-"}
            </span>
        ),
    },
];

export function AuditLogManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [search, setSearch] = useState("");
    const [entityFilter, setEntityFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<AuditLogEntry | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const pageSize = 15;

    useEffect(() => {
        const t = setTimeout(() => { setEntries(mockAuditLog()); setIsLoading(false); }, 400);
        return () => clearTimeout(t);
    }, []);

    const filtered = useMemo(() => {
        let r = [...entries];
        if (search) {
            const q = search.toLowerCase();
            r = r.filter(
                (e) =>
                    e.performedByName.toLowerCase().includes(q) ||
                    e.entityName.toLowerCase().includes(q) ||
                    (e.details?.toLowerCase().includes(q) ?? false),
            );
        }
        if (entityFilter && entityFilter !== "all") {
            r = r.filter((e) => e.entityType === entityFilter);
        }
        return r;
    }, [entries, search, entityFilter]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const entityTypes = [...new Set(entries.map((e) => e.entityType))];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Registro de Auditoria
                </h1>
                <p className="text-muted-foreground">
                    Historial cronologico de acciones administrativas en la plataforma
                </p>
            </div>

            <AdminDataTable
                data={paginated}
                columns={columns}
                actions={[
                    {
                        label: "Ver detalle",
                        icon: <Eye className="h-4 w-4" />,
                        onClick: (e) => { setSelected(e); setIsDetailOpen(true); },
                    },
                ]}
                keyExtractor={(e) => e.id}
                isLoading={isLoading}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por usuario, entidad o detalle..."
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                emptyTitle="No hay registros"
                emptyDescription="No se encontraron entradas de auditoria."
                emptyIcon={<ClipboardList className="h-6 w-6" />}
                toolbar={
                    <Select value={entityFilter} onValueChange={setEntityFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Entidad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {entityTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {ENTITY_LABELS[type] ?? type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                }
            />

            {/* Detail dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalle de Auditoria</DialogTitle>
                        <DialogDescription>
                            Informacion completa del registro
                        </DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-muted-foreground">Accion</p>
                                    <Badge variant={ACTION_VARIANTS[selected.action] ?? "outline"}>
                                        {ACTION_LABELS[selected.action] ?? selected.action}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Fecha y Hora</p>
                                    <p className="font-medium">
                                        {new Date(selected.createdAt).toLocaleString("es-CO")}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Entidad</p>
                                    <p className="font-medium">
                                        {ENTITY_LABELS[selected.entityType] ?? selected.entityType}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Nombre</p>
                                    <p className="font-medium">{selected.entityName}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Realizado por</p>
                                    <p className="font-medium">{selected.performedByName}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Direccion IP</p>
                                    <p className="font-medium font-mono">
                                        {selected.ipAddress ?? "No disponible"}
                                    </p>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-muted-foreground">Detalles</p>
                                <p>{selected.details ?? "Sin detalles adicionales"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">ID de Entidad</p>
                                <p className="font-mono text-xs">{selected.entityId}</p>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
