"use client";

/**
 * PermitsManagement — ABS permits management page.
 */

import { StatusBadge, getPermitStatusVariant } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ABS_PERMIT_STATUS, ABS_PERMIT_STATUS_LABELS, translateLabel } from "@/lib/constants";
import { mockPermits } from "@/lib/admin-mock";
import type { PermitAdminItem } from "@/types";
import { Eye, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const columns: ColumnDef<PermitAdminItem>[] = [
    { key: "resolutionNumber", header: "Resolucion", sortable: true, render: (p) => <span className="font-medium">{p.resolutionNumber}</span> },
    { key: "entrepreneurName", header: "Titular", render: (p) => p.entrepreneurName },
    { key: "speciesName", header: "Especie", hideOnMobile: true, render: (p) => <span className="italic">{p.speciesName}</span> },
    { key: "grantingAuthority", header: "Autoridad", hideOnMobile: true, render: (p) => p.grantingAuthority },
    { key: "status", header: "Estado", render: (p) => <StatusBadge label={translateLabel(ABS_PERMIT_STATUS_LABELS, p.status)} variant={getPermitStatusVariant(p.status)} /> },
    { key: "expirationDate", header: "Vencimiento", hideOnMobile: true, render: (p) => new Date(p.expirationDate).toLocaleDateString("es-CO") },
];

export function PermitsManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [permits, setPermits] = useState<PermitAdminItem[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<PermitAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => { const t = setTimeout(() => { setPermits(mockPermits()); setIsLoading(false); }, 400); return () => clearTimeout(t); }, []);

    const filtered = useMemo(() => {
        let r = [...permits];
        if (search) { const q = search.toLowerCase(); r = r.filter((p) => p.resolutionNumber.toLowerCase().includes(q) || p.entrepreneurName.toLowerCase().includes(q) || p.speciesName.toLowerCase().includes(q)); }
        if (statusFilter && statusFilter !== "all") r = r.filter((p) => p.status === statusFilter);
        return r;
    }, [permits, search, statusFilter]);

    const totalPages = Math.ceil(filtered.length / 15);
    const paginated = filtered.slice((page - 1) * 15, page * 15);

    const actions: RowAction<PermitAdminItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (p) => { setSelected(p); setIsDetailOpen(true); } },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gestion de Permisos ABS</h1>
                <p className="text-muted-foreground">Permisos de acceso a recursos geneticos — Protocolo de Nagoya</p>
            </div>
            <AdminDataTable
                data={paginated} columns={columns} actions={actions} keyExtractor={(p) => p.id}
                isLoading={isLoading} searchValue={search} onSearchChange={setSearch}
                searchPlaceholder="Buscar por resolucion, titular o especie..."
                currentPage={page} totalPages={totalPages} onPageChange={setPage}
                emptyTitle="No hay permisos" emptyIcon={<Shield className="h-6 w-6" />}
                toolbar={
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {Object.entries(ABS_PERMIT_STATUS).map(([k, v]) => <SelectItem key={k} value={v}>{translateLabel(ABS_PERMIT_STATUS_LABELS, v)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                }
            />
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Detalle de Permiso ABS</DialogTitle><DialogDescription>Informacion legal del permiso</DialogDescription></DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Resolucion</p><p className="font-medium">{selected.resolutionNumber}</p></div>
                                <div><p className="text-muted-foreground">Estado</p><StatusBadge label={translateLabel(ABS_PERMIT_STATUS_LABELS, selected.status)} variant={getPermitStatusVariant(selected.status)} /></div>
                                <div><p className="text-muted-foreground">Titular</p><p className="font-medium">{selected.entrepreneurName}</p></div>
                                <div><p className="text-muted-foreground">Especie</p><p className="font-medium italic">{selected.speciesName}</p></div>
                                <div><p className="text-muted-foreground">Autoridad</p><p className="font-medium">{selected.grantingAuthority}</p></div>
                                <div><p className="text-muted-foreground">Marco Legal</p><p className="font-medium">{selected.legalFramework ?? "-"}</p></div>
                                <div><p className="text-muted-foreground">Emision</p><p className="font-medium">{new Date(selected.emissionDate).toLocaleDateString("es-CO")}</p></div>
                                <div><p className="text-muted-foreground">Vencimiento</p><p className="font-medium">{new Date(selected.expirationDate).toLocaleDateString("es-CO")}</p></div>
                            </div>
                            <div className="flex justify-end"><Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button></div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
