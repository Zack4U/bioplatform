"use client";
/**
 * CertificationsManagement — admin moderation of product certifications.
 *
 * Entrepreneurs request certifications; Admin / Authority approve or reject.
 * UI-only; all logic in useCertificationsManagement.
 *
 * @module components/features/admin/certifications/CertificationsManagement
 */
import { useState } from "react";
import { StatusBadge } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { translateLabel } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";
import {
    useCertificationsList,
    useApproveCertification,
    useRejectCertification,
} from "@/hooks/features/admin/useCertificationsManagement";
import type { CertificationAdminItem } from "@/types/admin";
import { BadgeCheck, Check, Eye, FileText, X } from "lucide-react";
import { RequestCertificationDialog } from "./RequestCertificationDialog";

const CERT_STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
    active: "Activa",
    expired: "Expirada",
    suspended: "Suspendida",
    revoked: "Revocada",
};

const CERT_TYPE_LABELS: Record<string, string> = {
    Sustainability: "Sostenibilidad",
    Organic: "Orgánico",
    Quality: "Calidad",
    FairTrade: "Comercio Justo",
    ABS: "Cumplimiento ABS",
};

type BadgeVariant = "warning" | "success" | "destructive" | "info" | "default";

function statusVariant(status: string): BadgeVariant {
    switch (status?.toLowerCase()) {
        case "pending": return "warning";
        case "approved":
        case "active": return "success";
        case "rejected":
        case "revoked":
        case "expired": return "destructive";
        default: return "default";
    }
}

const columns: ColumnDef<CertificationAdminItem>[] = [
    { key: "name", header: "Certificación", sortable: true, render: (c) => <span className="font-medium">{c.name}</span> },
    { key: "productName", header: "Producto", render: (c) => <span className="text-sm">{c.productName}</span> },
    { key: "certificationType", header: "Tipo", hideOnMobile: true, render: (c) => <Badge variant="outline">{translateLabel(CERT_TYPE_LABELS, c.certificationType)}</Badge> },
    { key: "entrepreneurName", header: "Emprendedor", hideOnMobile: true, render: (c) => <span className="text-sm">{c.entrepreneurName ?? "—"}</span> },
    { key: "status", header: "Estado", render: (c) => <StatusBadge label={translateLabel(CERT_STATUS_LABELS, c.status)} variant={statusVariant(c.status)} /> },
    { key: "createdAt", header: "Solicitada", hideOnMobile: true, render: (c) => new Date(c.createdAt).toLocaleDateString("es-CO") },
];

export function CertificationsManagement() {
    const hasRole = useAuthStore((s) => s.hasRole);
    const canModerate = hasRole("ADMIN") || hasRole("AUTHORITY");
    const isEntrepreneur = hasRole("ENTREPRENEUR");

    const [statusFilter, setStatusFilter] = useState("Pending");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<CertificationAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isRequestOpen, setIsRequestOpen] = useState(false);

    const { certifications, totalPages, isLoading } = useCertificationsList({
        status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
        page,
        pageSize: 15,
    });

    const approve = useApproveCertification();
    const reject = useRejectCertification();

    const actions: RowAction<CertificationAdminItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (c) => { setSelected(c); setRejectReason(""); setIsDetailOpen(true); } },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Certificaciones</h1>
                    <p className="text-muted-foreground">Solicitudes de certificación de productos — aprobación y rechazo</p>
                </div>
                {isEntrepreneur && (
                    <Button onClick={() => setIsRequestOpen(true)}>
                        <BadgeCheck className="mr-2 h-4 w-4" /> Solicitar Certificación
                    </Button>
                )}
            </div>

            <AdminDataTable
                data={certifications}
                columns={columns}
                actions={actions}
                keyExtractor={(c) => c.id}
                isLoading={isLoading}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                emptyTitle="No hay certificaciones"
                emptyIcon={<BadgeCheck className="h-6 w-6" />}
                toolbar={
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="Pending">Pendientes</SelectItem>
                            <SelectItem value="Approved">Aprobadas</SelectItem>
                            <SelectItem value="Rejected">Rechazadas</SelectItem>
                        </SelectContent>
                    </Select>
                }
            />

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalle de Certificación</DialogTitle>
                        <DialogDescription>Revisión de la solicitud de certificación</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><p className="text-muted-foreground">Certificación</p><p className="font-medium">{selected.name}</p></div>
                                <div><p className="text-muted-foreground">Tipo</p><Badge variant="outline">{translateLabel(CERT_TYPE_LABELS, selected.certificationType)}</Badge></div>
                                <div><p className="text-muted-foreground">Estado</p><StatusBadge label={translateLabel(CERT_STATUS_LABELS, selected.status)} variant={statusVariant(selected.status)} /></div>
                                <div><p className="text-muted-foreground">Producto</p><p className="font-medium">{selected.productName}</p></div>
                                <div><p className="text-muted-foreground">Emprendedor</p><p className="font-medium">{selected.entrepreneurName ?? "—"}</p></div>
                                <div><p className="text-muted-foreground">Emisor</p><p className="font-medium">{selected.issuingBody}</p></div>
                                <div><p className="text-muted-foreground">Emitida</p><p className="font-medium">{new Date(selected.issuedAt).toLocaleDateString("es-CO")}</p></div>
                            </div>

                            {selected.documentUrl && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={selected.documentUrl} target="_blank" rel="noopener noreferrer">
                                        <FileText className="mr-2 h-4 w-4" />Ver documento
                                    </a>
                                </Button>
                            )}

                            {selected.rejectionReason && (
                                <>
                                    <Separator />
                                    <div><p className="text-muted-foreground">Motivo de rechazo</p><p>{selected.rejectionReason}</p></div>
                                </>
                            )}

                            {canModerate && selected.status?.toLowerCase() === "pending" && (
                                <>
                                    <Separator />
                                    <Textarea
                                        placeholder="Motivo de rechazo (requerido para rechazar)..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        rows={2}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            disabled={reject.isPending || !rejectReason.trim()}
                                            onClick={async () => {
                                                await reject.mutateAsync({ id: selected.id, reason: rejectReason.trim() });
                                                setIsDetailOpen(false);
                                            }}
                                        >
                                            <X className="mr-2 h-4 w-4" />Rechazar
                                        </Button>
                                        <Button
                                            disabled={approve.isPending}
                                            onClick={async () => {
                                                await approve.mutateAsync(selected.id);
                                                setIsDetailOpen(false);
                                            }}
                                        >
                                            <Check className="mr-2 h-4 w-4" />Aprobar
                                        </Button>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end">
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <RequestCertificationDialog open={isRequestOpen} onOpenChange={setIsRequestOpen} />
        </div>
    );
}
