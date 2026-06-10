"use client";
/**
 * RequestsManagement — aggregated platform requests. Connected to real API.
 * Sources: ABS permits pending, species images unvalidated, etc.
 */
import { useState, useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { StatusBadge } from "@/components/common";
import { SmartImage } from "@/components/common/SmartImage";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { PlatformRequestItem } from "@/types/admin";
import { Award, Eye, FileText, Image as ImageIcon, RefreshCw, Shield } from "lucide-react";
import { useRequestsList } from "@/hooks/features/admin/useRequestsManagement";
import { translateLabel } from "@/lib/constants";
import { useRouter } from "next/navigation";

const TYPE_LABELS: Record<string, string> = {
    abs_permit: "Permiso ABS",
    image_validation: "Validación de Imagen",
    product_approval: "Aprobación de Producto",
    account_verification: "Verificación de Cuenta",
};

const STATUS_VARIANT: Record<string, "warning" | "success" | "destructive" | "info" | "default"> = {
    pending: "warning",
    active: "success",
    approved: "success",
    rejected: "destructive",
    expired: "destructive",
    suspended: "warning",
    in_review: "info",
};

/** Spanish labels for request statuses (case-insensitive lookup via translateLabel). */
const STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente",
    active: "Activo",
    approved: "Aprobada",
    rejected: "Rechazada",
    expired: "Expirado",
    suspended: "Suspendido",
    in_review: "En Revisión",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
    abs_permit: <Shield className="h-4 w-4" />,
    image_validation: <ImageIcon className="h-4 w-4" />,
    product_approval: <FileText className="h-4 w-4" />,
    certification: <Award className="h-4 w-4" />,
};

const columns: ColumnDef<PlatformRequestItem>[] = [
    {
        key: "type", header: "Tipo",
        render: (r) => (
            <Badge variant="outline" className="gap-1">
                {TYPE_ICONS[r.type]}{TYPE_LABELS[r.type] ?? r.typeLabel}
            </Badge>
        ),
    },
    { key: "requesterName", header: "Solicitante", sortable: true, render: (r) => <span className="font-medium">{r.requesterName}</span> },
    { key: "subject", header: "Asunto", hideOnMobile: true, render: (r) => <span className="truncate max-w-[200px] inline-block">{r.subject}</span> },
    {
        key: "status", header: "Estado",
        render: (r) => <StatusBadge label={translateLabel(STATUS_LABELS, r.status)} variant={STATUS_VARIANT[r.status?.toLowerCase()] ?? "default"} />,
    },
    { key: "createdAt", header: "Fecha", hideOnMobile: true, render: (r) => new Date(r.createdAt).toLocaleDateString("es-CO") },
];

export function RequestsManagement() {
    const { user } = useAuthStore();
    const isReviewer = user?.roles?.some((r) => r === "ADMIN" || r === "AUTHORITY") ?? false;
    const isResearcher = user?.roles?.some((r) => r === "RESEARCHER") ?? false;

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<PlatformRequestItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const router = useRouter();

    const { data, isLoading, refetch } = useRequestsList({
        // Researchers can only see image_validation requests
        type: typeFilter && typeFilter !== "all"
            ? typeFilter
            : (isReviewer ? undefined : user?.roles?.includes("RESEARCHER") ? "image_validation" : undefined),
        status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
        page,
        pageSize: 20,
    });

    const items = data?.items ?? [];
    const totalPages = data?.totalPages ?? 1;

    const handleNavigateToRef = useCallback((item: PlatformRequestItem) => {
        // Deep-link to the matching module, filtered/highlighted to this specific request.
        switch (item.referenceType) {
            case "SpeciesImage":
                // parentReferenceId = speciesId, parentReferenceName = speciesName
                router.push(
                    `/admin/images?speciesId=${item.parentReferenceId ?? item.referenceId ?? ""}` +
                    (item.parentReferenceName ? `&speciesName=${encodeURIComponent(item.parentReferenceName)}` : "")
                );
                break;
            case "AbsPermit":
                router.push(`/admin/permits?permitId=${item.referenceId ?? ""}`);
                break;
            case "Product":
                router.push(`/admin/products?productId=${item.referenceId ?? ""}&filter=pending`);
                break;
            case "Certification":
                router.push(`/admin/certifications?certId=${item.referenceId ?? ""}&filter=pending`);
                break;
        }
    }, [router]);

    const canNavigateToRef = (item: PlatformRequestItem) =>
        ["SpeciesImage", "AbsPermit", "Product", "Certification"].includes(item.referenceType ?? "");

    const actions: RowAction<PlatformRequestItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (r) => { setSelected(r); setIsDetailOpen(true); } },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{isReviewer ? "Solicitudes" : "Mis Solicitudes"}</h1>
                    <p className="text-muted-foreground">
                        {isReviewer
                            ? "Centro de solicitudes pendientes de revisión en la plataforma"
                            : "Estado de tus solicitudes enviadas (permisos ABS, validación de imágenes, etc.)"}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" />Actualizar
                </Button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { label: "Permisos ABS", type: "abs_permit" },
                    { label: "Imágenes", type: "image_validation" },
                    { label: "Productos", type: "product_approval" },
                    { label: "Verificaciones", type: "account_verification" },
                ].map(({ label, type }) => {
                    const count = (data?.items ?? []).filter((r) => r.type === type).length;
                    return (
                        <button
                            key={type}
                            className="rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors"
                            onClick={() => { setTypeFilter(type); setPage(1); }}
                        >
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                        </button>
                    );
                })}
            </div>

            <AdminDataTable
                data={items} columns={columns} actions={actions} keyExtractor={(r) => r.id}
                isLoading={isLoading} searchValue={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                searchPlaceholder="Buscar por solicitante o asunto..."
                currentPage={page} totalPages={totalPages} onPageChange={setPage}
                emptyTitle={isReviewer ? "No hay solicitudes pendientes" : "No has enviado solicitudes"} emptyIcon={<FileText className="h-6 w-6" />}
                toolbar={
                    <div className="flex gap-2">
                        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los tipos</SelectItem>
                                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="active">Activo</SelectItem>
                                <SelectItem value="expired">Expirado</SelectItem>
                                <SelectItem value="rejected">Rechazado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                }
            />

            {/* Detail dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalle de Solicitud</DialogTitle>
                        <DialogDescription>Revisión y acción sobre la solicitud</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Tipo</p>
                                    <Badge variant="outline" className="gap-1 mt-1">
                                        {TYPE_ICONS[selected.type]}{TYPE_LABELS[selected.type] ?? selected.typeLabel}
                                    </Badge>
                                </div>
                                <div><p className="text-muted-foreground">Estado</p>
                                    <StatusBadge label={translateLabel(STATUS_LABELS, selected.status)} variant={STATUS_VARIANT[selected.status?.toLowerCase()] ?? "default"} />
                                </div>
                                <div className="col-span-2"><p className="text-muted-foreground">Asunto</p><p className="font-medium">{selected.subject}</p></div>
                                {selected.description && (
                                    <div className="col-span-2"><p className="text-muted-foreground">Descripción</p><p>{selected.description}</p></div>
                                )}
                                <div><p className="text-muted-foreground">Solicitante</p><p className="font-medium">{selected.requesterName}</p></div>
                                <div><p className="text-muted-foreground">Fecha</p><p>{new Date(selected.createdAt).toLocaleDateString("es-CO")}</p></div>
                            </div>

                            {selected.referenceUrl && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-muted-foreground mb-2">Referencia</p>
                                        {selected.referenceType === "SpeciesImage" && (
                                            <SmartImage src={selected.referenceUrl} alt="Imagen referenciada"
                                                width={400} height={192}
                                                className="rounded-lg max-h-48 w-auto object-contain border" />
                                        )}
                                    </div>
                                </>
                            )}

                            {selected.reviewerNotes && (
                                <>
                                    <Separator />
                                    <div><p className="text-muted-foreground">Notas del revisor</p><p className="text-sm">{selected.reviewerNotes}</p></div>
                                </>
                            )}

                            <div className="flex justify-end gap-2">
                                {canNavigateToRef(selected) && (
                                    <Button variant="outline" size="sm" onClick={() => { handleNavigateToRef(selected); setIsDetailOpen(false); }}>
                                        Ver en módulo →
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
