"use client";

/**
 * RequestsManagement — solicitudes/requests management page.
 */

import { StatusBadge } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { REQUEST_STATUSES, REQUEST_TYPES, REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS, translateLabel } from "@/lib/constants";
import { mockRequests } from "@/lib/admin-mock";
import type { RequestAdminItem } from "@/types";
import { Check, Eye, FileText, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const STATUS_VARIANT: Record<string, "warning" | "success" | "destructive" | "info"> = {
    pending: "warning", approved: "success", rejected: "destructive", in_review: "info",
};

const columns: ColumnDef<RequestAdminItem>[] = [
    { key: "type", header: "Tipo", render: (r) => <Badge variant="outline">{translateLabel(REQUEST_TYPE_LABELS, r.type)}</Badge> },
    { key: "requesterName", header: "Solicitante", sortable: true, render: (r) => <span className="font-medium">{r.requesterName}</span> },
    { key: "subject", header: "Asunto", hideOnMobile: true, render: (r) => <span className="truncate max-w-[200px] inline-block">{r.subject}</span> },
    { key: "status", header: "Estado", render: (r) => <StatusBadge label={translateLabel(REQUEST_STATUS_LABELS, r.status)} variant={STATUS_VARIANT[r.status] ?? "default"} /> },
    { key: "createdAt", header: "Fecha", hideOnMobile: true, render: (r) => new Date(r.createdAt).toLocaleDateString("es-CO") },
];

export function RequestsManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<RequestAdminItem[]>([]);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<RequestAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => { const t = setTimeout(() => { setRequests(mockRequests()); setIsLoading(false); }, 400); return () => clearTimeout(t); }, []);

    const filtered = useMemo(() => {
        let r = [...requests];
        if (search) { const q = search.toLowerCase(); r = r.filter((req) => req.requesterName.toLowerCase().includes(q) || req.subject.toLowerCase().includes(q)); }
        if (typeFilter && typeFilter !== "all") r = r.filter((req) => req.type === typeFilter);
        if (statusFilter && statusFilter !== "all") r = r.filter((req) => req.status === statusFilter);
        return r;
    }, [requests, search, typeFilter, statusFilter]);

    const totalPages = Math.ceil(filtered.length / 15);
    const paginated = filtered.slice((page - 1) * 15, page * 15);

    const handleApprove = (id: string) => { setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" as const, updatedAt: new Date().toISOString() } : r)); setIsDetailOpen(false); };
    const handleReject = (id: string) => { setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" as const, updatedAt: new Date().toISOString() } : r)); setIsDetailOpen(false); };

    const actions: RowAction<RequestAdminItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (r) => { setSelected(r); setIsDetailOpen(true); } },
        { label: "Aprobar", icon: <Check className="h-4 w-4" />, onClick: (r) => handleApprove(r.id), hidden: (r) => r.status !== "pending" && r.status !== "in_review" },
        { label: "Rechazar", icon: <X className="h-4 w-4" />, onClick: (r) => handleReject(r.id), variant: "destructive", hidden: (r) => r.status !== "pending" && r.status !== "in_review" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gestion de Solicitudes</h1>
                <p className="text-muted-foreground">Aprobacion y seguimiento de solicitudes</p>
            </div>
            <AdminDataTable
                data={paginated} columns={columns} actions={actions} keyExtractor={(r) => r.id}
                isLoading={isLoading} searchValue={search} onSearchChange={setSearch}
                searchPlaceholder="Buscar por solicitante o asunto..."
                currentPage={page} totalPages={totalPages} onPageChange={setPage}
                emptyTitle="No hay solicitudes" emptyIcon={<FileText className="h-6 w-6" />}
                toolbar={
                    <div className="flex gap-2">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {Object.entries(REQUEST_TYPES).map(([k, v]) => <SelectItem key={k} value={v}>{translateLabel(REQUEST_TYPE_LABELS, v)}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {Object.entries(REQUEST_STATUSES).map(([k, v]) => <SelectItem key={k} value={v}>{translateLabel(REQUEST_STATUS_LABELS, v)}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                }
            />
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Detalle de Solicitud</DialogTitle><DialogDescription>Revision y decision</DialogDescription></DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Tipo</p><Badge variant="outline">{translateLabel(REQUEST_TYPE_LABELS, selected.type)}</Badge></div>
                                <div><p className="text-muted-foreground">Estado</p><StatusBadge label={translateLabel(REQUEST_STATUS_LABELS, selected.status)} variant={STATUS_VARIANT[selected.status] ?? "default"} /></div>
                                <div><p className="text-muted-foreground">Solicitante</p><p className="font-medium">{selected.requesterName}</p></div>
                                <div><p className="text-muted-foreground">Fecha</p><p className="font-medium">{new Date(selected.createdAt).toLocaleDateString("es-CO")}</p></div>
                            </div>
                            <Separator />
                            <div><p className="text-muted-foreground">Asunto</p><p className="font-medium">{selected.subject}</p></div>
                            <div><p className="text-muted-foreground">Descripcion</p><p>{selected.description}</p></div>
                            {selected.reviewerNotes && <div><p className="text-muted-foreground">Notas del revisor</p><p>{selected.reviewerNotes}</p></div>}
                            <div className="flex justify-end gap-2">
                                {(selected.status === "pending" || selected.status === "in_review") && (<>
                                    <Button variant="destructive" onClick={() => handleReject(selected.id)}><X className="mr-2 h-4 w-4" />Rechazar</Button>
                                    <Button onClick={() => handleApprove(selected.id)}><Check className="mr-2 h-4 w-4" />Aprobar</Button>
                                </>)}
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
