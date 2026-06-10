"use client";

/**
 * ReviewsManagement — reviews and ratings moderation page.
 * Admin: sees all reviews, can report/unreport and delete.
 * Entrepreneur: sees reviews on own products, can report/unreport only.
 */

import { useState } from "react";
import { StatusBadge } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";

import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useHasRole } from "@/hooks/features/auth";
import {
    useManagedReviews,
    useToggleReviewReport,
    useDeleteManagedReview,
} from "@/hooks/features/admin/useReviewsManagement";
import type { ReviewManagedItem } from "@/types/admin";
import { AlertCircle, Eye, Flag, Star, Trash2 } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
    return (
        <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < rating ? "text-warning fill-warning" : "text-muted-foreground/30"}`}
                />
            ))}
        </span>
    );
}

const columns: ColumnDef<ReviewManagedItem>[] = [
    { key: "productName", header: "Producto", render: (r) => <span className="font-medium">{r.productName}</span> },
    { key: "userName", header: "Usuario", render: (r) => r.userName ?? "—" },
    { key: "rating", header: "Calificacion", render: (r) => <StarRating rating={r.rating} /> },
    { key: "comment", header: "Comentario", hideOnMobile: true, render: (r) => <span className="truncate max-w-[200px] inline-block text-sm text-muted-foreground">{r.comment ?? "-"}</span> },
    { key: "isReported", header: "Estado", render: (r) => r.isReported ? <StatusBadge label="Reportada" variant="destructive" /> : <StatusBadge label="OK" variant="success" /> },
    { key: "createdAt", header: "Fecha", hideOnMobile: true, render: (r) => new Date(r.createdAt).toLocaleDateString("es-CO") },
];

export function ReviewsManagement() {
    const isAdmin = useHasRole("ADMIN");
    const isEntrepreneur = useHasRole("ENTREPRENEUR");

    const [reportFilter, setReportFilter] = useState("");
    const [ratingFilter, setRatingFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<ReviewManagedItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState<ReviewManagedItem | null>(null);
    const [reportReason, setReportReason] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<ReviewManagedItem | null>(null);

    const { data, isLoading, isError, error } = useManagedReviews({
        isReported: reportFilter === "reported" ? true : reportFilter === "clean" ? false : undefined,
        page,
        pageSize: 15,
    });

    const toggleReport = useToggleReviewReport();
    const deleteReview = useDeleteManagedReview();

    const allItems = data?.items ?? [];
    const items = ratingFilter && ratingFilter !== "all"
        ? allItems.filter((r) => r.rating === Number(ratingFilter))
        : allItems;
    const totalPages = data?.totalPages ?? 1;

    const is403 = isError && (error as { response?: { status?: number } })?.response?.status === 403;

    const openReportDialog = (r: ReviewManagedItem) => {
        setReportTarget(r);
        setReportReason(r.isReported ? "" : "");
    };

    const confirmToggleReport = async () => {
        if (!reportTarget) return;
        await toggleReport.mutateAsync({
            reviewId: reportTarget.id,
            reason: reportTarget.isReported ? undefined : (reportReason || undefined),
        });
        setReportTarget(null);
        setReportReason("");
    };

    const actions: RowAction<ReviewManagedItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (r) => { setSelected(r); setIsDetailOpen(true); } },
        { label: "Reportar / Quitar reporte", icon: <Flag className="h-4 w-4" />, onClick: openReportDialog },
        ...(isAdmin
            ? [{ label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: (r: ReviewManagedItem) => setDeleteTarget(r), variant: "destructive" as const }]
            : []),
    ];

    if (is403) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="text-sm">No tienes permisos para ver las resenas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gestion de Resenas</h1>
                <p className="text-muted-foreground">
                    {isEntrepreneur && !isAdmin
                        ? "Moderacion de resenas de tus productos"
                        : "Moderacion de resenas y calificaciones de productos"}
                </p>
            </div>
            <AdminDataTable
                data={items} columns={columns} actions={actions} keyExtractor={(r) => r.id}
                isLoading={isLoading}
                currentPage={page} totalPages={totalPages} onPageChange={setPage}
                emptyTitle="No hay resenas" emptyIcon={<Star className="h-6 w-6" />}
                toolbar={
                    <div className="flex gap-2">
                        <Select value={ratingFilter} onValueChange={setRatingFilter}>
                            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Rating" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} estrellas</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={reportFilter} onValueChange={(v) => { setReportFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="reported">Reportadas</SelectItem>
                                <SelectItem value="clean">Sin reportar</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                }
            />

            {/* Detail dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Detalle de Resena</DialogTitle><DialogDescription>Revision y moderacion</DialogDescription></DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Producto</p><p className="font-medium">{selected.productName}</p></div>
                                <div><p className="text-muted-foreground">Usuario</p><p className="font-medium">{selected.userName ?? "—"}</p></div>
                                <div><p className="text-muted-foreground">Calificacion</p><StarRating rating={selected.rating} /></div>
                                <div><p className="text-muted-foreground">Estado</p>{selected.isReported ? <StatusBadge label="Reportada" variant="destructive" /> : <StatusBadge label="OK" variant="success" />}</div>
                            </div>
                            <Separator />
                            {selected.title && <div><p className="text-muted-foreground">Titulo</p><p className="font-medium">{selected.title}</p></div>}
                            <div><p className="text-muted-foreground">Comentario</p><p>{selected.comment ?? "Sin comentario"}</p></div>
                            {selected.isReported && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <div><p className="text-muted-foreground">Reportada por</p><p className="font-medium">{selected.reportedByName ?? "—"}</p></div>
                                        {selected.reportReason && <div><p className="text-muted-foreground">Motivo</p><p>{selected.reportReason}</p></div>}
                                        {selected.reportedAt && <div><p className="text-muted-foreground">Fecha de reporte</p><p>{new Date(selected.reportedAt).toLocaleDateString("es-CO")}</p></div>}
                                    </div>
                                </>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => openReportDialog(selected)}>
                                    <Flag className="mr-2 h-4 w-4" />{selected.isReported ? "Quitar reporte" : "Reportar"}
                                </Button>
                                {isAdmin && (
                                    <Button variant="destructive" size="sm" onClick={() => { setIsDetailOpen(false); setDeleteTarget(selected); }}>
                                        <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Report / unreport dialog */}
            <Dialog open={!!reportTarget} onOpenChange={(o) => { if (!o) { setReportTarget(null); setReportReason(""); } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{reportTarget?.isReported ? "Quitar reporte" : "Reportar resena"}</DialogTitle>
                        <DialogDescription>
                            {reportTarget?.isReported
                                ? "Se eliminara el marcado de reporte sobre esta resena."
                                : "Indica el motivo del reporte (opcional)."}
                        </DialogDescription>
                    </DialogHeader>
                    {!reportTarget?.isReported && (
                        <Textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Motivo del reporte..."
                            rows={3}
                        />
                    )}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => { setReportTarget(null); setReportReason(""); }}>Cancelar</Button>
                        <Button
                            variant={reportTarget?.isReported ? "outline" : "destructive"}
                            disabled={toggleReport.isPending}
                            onClick={confirmToggleReport}
                        >
                            {reportTarget?.isReported ? "Quitar reporte" : "Reportar"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirm — admin only */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar esta resena?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La resena de <span className="font-semibold">{deleteTarget?.userName ?? "este usuario"}</span> sobre <span className="font-semibold">{deleteTarget?.productName}</span> sera eliminada permanentemente. Esta accion no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => { if (deleteTarget) { deleteReview.mutate(deleteTarget.id); setDeleteTarget(null); } }}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
