"use client";
/**
 * PermitsManagement — ABS Permits admin. Connected to real API.
 * Includes create, detail view, revoke, and PDF document upload.
 */
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { StatusBadge, getPermitStatusVariant } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ABS_PERMIT_STATUS, ABS_PERMIT_STATUS_LABELS, translateLabel } from "@/lib/constants";
import type { PermitAdminItem } from "@/types/admin";
import { CheckCircle2, Eye, FileText, Send, Shield, XCircle, ExternalLink } from "lucide-react";
import {
    usePermitsList, useEntrepreneurPermitsList, useRevokePermit, useUploadPermitDocument,
    useCancelAbsPermitRequest, useRejectAbsPermit,
} from "@/hooks/features/admin/usePermitsManagement";
import { PermitRequestDialog } from "./PermitRequestDialog";
import { ApprovePermitDialog } from "./ApprovePermitDialog";

const columns: ColumnDef<PermitAdminItem>[] = [
    { key: "resolutionNumber", header: "Resolución", sortable: true, render: (p) => <span className="font-medium font-mono">{p.resolutionNumber || "—"}</span> },
    { key: "entrepreneurName", header: "Titular", render: (p) => p.entrepreneurName },
    { key: "speciesName", header: "Especie", hideOnMobile: true, render: (p) => <span className="italic font-mono text-xs">{p.speciesName ?? p.speciesId.replace(/-/g, "").slice(0, 8).toUpperCase()}</span> },
    { key: "grantingAuthority", header: "Autoridad", hideOnMobile: true, render: (p) => p.grantingAuthority || "—" },
    { key: "status", header: "Estado", render: (p) => <StatusBadge label={translateLabel(ABS_PERMIT_STATUS_LABELS, p.status)} variant={getPermitStatusVariant(p.status)} /> },
    { key: "expirationDate", header: "Vencimiento", hideOnMobile: true, render: (p) => {
        if (p.status === "Pending") return <span>{new Date(p.requestedAt).toLocaleDateString("es-CO")} <span className="text-muted-foreground">(solicitado)</span></span>;
        const date = new Date(p.expirationDate);
        const isExpiring = date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return <span className={isExpiring ? "text-amber-500 font-medium" : ""}>{date.toLocaleDateString("es-CO")}</span>;
    }},
];

export function PermitsManagement() {
    const { user } = useAuthStore();
    const isEntrepreneur = user?.roles?.includes("ENTREPRENEUR") ?? false;

    const searchParams = useSearchParams();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<PermitAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState<PermitAdminItem | null>(null);
    const [cancelTarget, setCancelTarget] = useState<PermitAdminItem | null>(null);
    const [approveTarget, setApproveTarget] = useState<PermitAdminItem | null>(null);
    const [rejectTarget, setRejectTarget] = useState<PermitAdminItem | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [deepLinked, setDeepLinked] = useState(false);

    const statusParam = statusFilter && statusFilter !== "all" ? statusFilter : undefined;

    // Admin/Authority → paginated all-permits endpoint
    const { data: adminData, isLoading: isAdminLoading } = usePermitsList({
        status: statusParam,
        page,
        pageSize: 15,
        enabled: !isEntrepreneur,
    });

    // Entrepreneur → own-permits endpoint (non-paginated)
    const { data: entrepreneurPermits, isLoading: isEntrepreneurLoading } = useEntrepreneurPermitsList(
        isEntrepreneur ? (user?.id ?? "") : ""
    );

    const isLoading = isEntrepreneur ? isEntrepreneurLoading : isAdminLoading;
    const items = useMemo(
        () => (isEntrepreneur ? (entrepreneurPermits ?? []) : (adminData?.items ?? [])),
        [isEntrepreneur, entrepreneurPermits, adminData]
    );
    const totalPages = isEntrepreneur ? 1 : (adminData?.totalPages ?? 1);

    // Deep-link: if the URL contains ?permitId=, auto-open that permit's detail dialog.
    useEffect(() => {
        if (deepLinked || isLoading || items.length === 0) return;
        const permitId = searchParams.get("permitId");
        if (!permitId) return;
        const found = items.find((p) => p.id === permitId);
        if (found) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelected(found);
            setIsDetailOpen(true);
            setDeepLinked(true);
        }
    }, [items, isLoading, searchParams, deepLinked]);

    const revokePermit = useRevokePermit();
    const cancelRequest = useCancelAbsPermitRequest();
    const rejectPermit = useRejectAbsPermit();
    const { mutateAsync: uploadDoc, uploadProgress, isPending: isUploading } = useUploadPermitDocument();

    const closeReject = () => { setRejectTarget(null); setRejectReason(""); };
    const submitReject = async () => {
        if (!rejectTarget) return;
        await rejectPermit.mutateAsync({ id: rejectTarget.id, data: { reason: rejectReason } });
        closeReject();
    };

    const actions: RowAction<PermitAdminItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (p) => { setSelected(p); setIsDetailOpen(true); } },
        ...(isEntrepreneur ? [
            { label: "Cancelar solicitud", icon: <XCircle className="h-4 w-4" />, onClick: (p: PermitAdminItem) => setCancelTarget(p), className: "text-destructive", hidden: (p: PermitAdminItem) => p.status !== "Pending" },
        ] : [
            { label: "Aprobar", icon: <CheckCircle2 className="h-4 w-4" />, onClick: (p: PermitAdminItem) => setApproveTarget(p), hidden: (p: PermitAdminItem) => p.status !== "Pending" },
            { label: "Rechazar", icon: <XCircle className="h-4 w-4" />, onClick: (p: PermitAdminItem) => setRejectTarget(p), className: "text-destructive", hidden: (p: PermitAdminItem) => p.status !== "Pending" },
            { label: "Revocar", icon: <XCircle className="h-4 w-4" />, onClick: (p: PermitAdminItem) => setRevokeTarget(p), className: "text-destructive", hidden: (p: PermitAdminItem) => p.status !== "Active" && p.status !== "Suspended" },
        ]),
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Permisos ABS</h1>
                    <p className="text-muted-foreground">Acceso a recursos genéticos — Protocolo de Nagoya</p>
                </div>
                {isEntrepreneur && (
                    <Button onClick={() => setIsRequestOpen(true)}>
                        <Send className="mr-2 h-4 w-4" /> Solicitar Permiso
                    </Button>
                )}
            </div>

            <AdminDataTable
                data={items} columns={columns} actions={actions} keyExtractor={(p) => p.id}
                isLoading={isLoading} searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
                searchPlaceholder="Buscar por resolución, titular o especie..."
                currentPage={page} totalPages={totalPages} onPageChange={setPage}
                emptyTitle="No hay permisos ABS" emptyIcon={<Shield className="h-6 w-6" />}
                toolbar={
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {Object.entries(ABS_PERMIT_STATUS).map(([k, v]) => (
                                <SelectItem key={k} value={v}>{translateLabel(ABS_PERMIT_STATUS_LABELS, v)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                }
            />

            {/* Detail dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalle de Permiso ABS</DialogTitle>
                        <DialogDescription>Información legal del permiso de acceso a recursos genéticos</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Resolución</p><p className="font-medium font-mono">{selected.resolutionNumber || "—"}</p></div>
                                <div><p className="text-muted-foreground">Estado</p><StatusBadge label={translateLabel(ABS_PERMIT_STATUS_LABELS, selected.status)} variant={getPermitStatusVariant(selected.status)} /></div>
                                <div><p className="text-muted-foreground">Titular</p><p className="font-medium">{selected.entrepreneurName}</p></div>
                                <div><p className="text-muted-foreground">Especie</p><p className="font-medium italic">{selected.speciesName ?? <span className="font-mono text-xs">{selected.speciesId}</span>}</p></div>
                                {selected.status !== "Pending" && selected.status !== "Rejected" && (
                                    <>
                                        <div><p className="text-muted-foreground">Autoridad</p><p className="font-medium">{selected.grantingAuthority || "—"}</p></div>
                                        <div><p className="text-muted-foreground">Marco Legal</p><p className="font-medium">{selected.legalFramework ?? "-"}</p></div>
                                        <div><p className="text-muted-foreground">Emisión</p><p className="font-medium">{new Date(selected.emissionDate).toLocaleDateString("es-CO")}</p></div>
                                        <div><p className="text-muted-foreground">Vencimiento</p><p className="font-medium">{new Date(selected.expirationDate).toLocaleDateString("es-CO")}</p></div>
                                    </>
                                )}
                                <div><p className="text-muted-foreground">Solicitado</p><p className="font-medium">{new Date(selected.requestedAt).toLocaleDateString("es-CO")}</p></div>
                                {selected.approvedByName && (
                                    <div><p className="text-muted-foreground">{selected.status === "Rejected" ? "Rechazado por" : "Aprobado por"}</p><p className="font-medium">{selected.approvedByName}</p></div>
                                )}
                                {selected.approvedAt && (
                                    <div><p className="text-muted-foreground">Fecha de resolución</p><p className="font-medium">{new Date(selected.approvedAt).toLocaleDateString("es-CO")}</p></div>
                                )}
                            </div>

                            {selected.justification && (
                                <div>
                                    <p className="text-muted-foreground mb-1">Justificación</p>
                                    <p className="rounded-md border bg-muted/30 p-2">{selected.justification}</p>
                                </div>
                            )}

                            {selected.status === "Rejected" && selected.rejectionReason && (
                                <div>
                                    <p className="text-muted-foreground mb-1">Motivo de rechazo</p>
                                    <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-destructive">{selected.rejectionReason}</p>
                                </div>
                            )}

                            {/* Document */}
                            {selected.documentUrl && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-muted-foreground mb-2">Documento PDF</p>
                                        <a href={selected.documentUrl} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm">
                                                <FileText className="mr-2 h-4 w-4" />Ver documento
                                                <ExternalLink className="ml-2 h-3 w-3" />
                                            </Button>
                                        </a>
                                    </div>
                                </>
                            )}

                            {/* PDF upload — admin/authority only, issued permits */}
                            {!isEntrepreneur && selected.status !== "Pending" && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-muted-foreground mb-1">Subir documento PDF</p>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            disabled={isUploading}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) await uploadDoc(file);
                                            }}
                                            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent cursor-pointer"
                                        />
                                        {isUploading && <Progress value={uploadProgress} className="mt-2 h-2" />}
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-2">
                                {isEntrepreneur && selected.status === "Pending" && (
                                    <Button variant="destructive" size="sm" onClick={() => { setCancelTarget(selected); setIsDetailOpen(false); }}>
                                        <XCircle className="mr-2 h-4 w-4" />Cancelar solicitud
                                    </Button>
                                )}
                                {!isEntrepreneur && selected.status === "Pending" && (
                                    <>
                                        <Button variant="destructive" size="sm" onClick={() => { setRejectTarget(selected); setIsDetailOpen(false); }}>
                                            <XCircle className="mr-2 h-4 w-4" />Rechazar
                                        </Button>
                                        <Button size="sm" onClick={() => { setApproveTarget(selected); setIsDetailOpen(false); }}>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />Aprobar
                                        </Button>
                                    </>
                                )}
                                {!isEntrepreneur && (selected.status === "Active" || selected.status === "Suspended") && (
                                    <Button variant="destructive" size="sm" onClick={() => { setRevokeTarget(selected); setIsDetailOpen(false); }}>
                                        <XCircle className="mr-2 h-4 w-4" />Revocar
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>



            {/* Request dialog — entrepreneur only */}
            {isEntrepreneur && (
                <PermitRequestDialog open={isRequestOpen} onOpenChange={setIsRequestOpen} />
            )}

            {/* Approve dialog — admin/authority only */}
            {!isEntrepreneur && (
                <ApprovePermitDialog permit={approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)} />
            )}

            {/* Reject dialog — admin/authority only */}
            <Dialog open={!isEntrepreneur && !!rejectTarget} onOpenChange={(o) => !o && closeReject()}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rechazar solicitud de permiso ABS</DialogTitle>
                        <DialogDescription>
                            Indica el motivo por el cual se rechaza la solicitud de{" "}
                            <span className="font-medium">{rejectTarget?.entrepreneurName}</span>. El emprendedor podrá ver este motivo.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Motivo del rechazo..."
                        rows={4}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={closeReject}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            disabled={!rejectReason.trim() || rejectPermit.isPending}
                            onClick={submitReject}
                        >
                            {rejectPermit.isPending ? "Rechazando..." : "Rechazar solicitud"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel request confirm — entrepreneur only */}
            <AlertDialog open={isEntrepreneur && !!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar esta solicitud de permiso?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tu solicitud de permiso ABS para la especie será retirada de forma permanente. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => { if (cancelTarget) { cancelRequest.mutate(cancelTarget.id); setCancelTarget(null); } }}
                        >
                            Cancelar solicitud
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Revoke confirm — admin/authority only */}
            <AlertDialog open={!isEntrepreneur && !!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Revocar este permiso ABS?</AlertDialogTitle>
                        <AlertDialogDescription>
                            El permiso <span className="font-semibold">{revokeTarget?.resolutionNumber}</span> será revocado de forma permanente. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => { if (revokeTarget) { revokePermit.mutate(revokeTarget.id); setRevokeTarget(null); } }}
                        >
                            Revocar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
