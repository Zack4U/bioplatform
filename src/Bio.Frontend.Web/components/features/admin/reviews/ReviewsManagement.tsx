"use client";

/**
 * ReviewsManagement — reviews and ratings moderation page.
 */

import { StatusBadge } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { mockReviews } from "@/lib/admin-mock";
import type { ReviewAdminItem } from "@/types";
import { Eye, Flag, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const columns: ColumnDef<ReviewAdminItem>[] = [
    { key: "productName", header: "Producto", render: (r) => <span className="font-medium">{r.productName}</span> },
    { key: "userName", header: "Usuario", render: (r) => r.userName },
    { key: "rating", header: "Calificacion", render: (r) => <StarRating rating={r.rating} /> },
    { key: "comment", header: "Comentario", hideOnMobile: true, render: (r) => <span className="truncate max-w-[200px] inline-block text-sm text-muted-foreground">{r.comment ?? "-"}</span> },
    { key: "isFlagged", header: "Marcado", render: (r) => r.isFlagged ? <StatusBadge label="Reportado" variant="destructive" /> : <StatusBadge label="OK" variant="success" /> },
    { key: "createdAt", header: "Fecha", hideOnMobile: true, render: (r) => new Date(r.createdAt).toLocaleDateString("es-CO") },
];

export function ReviewsManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [reviews, setReviews] = useState<ReviewAdminItem[]>([]);
    const [search, setSearch] = useState("");
    const [flagFilter, setFlagFilter] = useState("");
    const [ratingFilter, setRatingFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<ReviewAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => { const t = setTimeout(() => { setReviews(mockReviews()); setIsLoading(false); }, 400); return () => clearTimeout(t); }, []);

    const filtered = useMemo(() => {
        let r = [...reviews];
        if (search) { const q = search.toLowerCase(); r = r.filter((rv) => rv.productName.toLowerCase().includes(q) || rv.userName.toLowerCase().includes(q)); }
        if (flagFilter === "flagged") r = r.filter((rv) => rv.isFlagged);
        if (flagFilter === "clean") r = r.filter((rv) => !rv.isFlagged);
        if (ratingFilter && ratingFilter !== "all") r = r.filter((rv) => rv.rating === Number(ratingFilter));
        return r;
    }, [reviews, search, flagFilter, ratingFilter]);

    const totalPages = Math.ceil(filtered.length / 15);
    const paginated = filtered.slice((page - 1) * 15, page * 15);

    const handleFlag = (id: string) => { setReviews((prev) => prev.map((r) => r.id === id ? { ...r, isFlagged: !r.isFlagged } : r)); };
    const handleDelete = (id: string) => { setReviews((prev) => prev.filter((r) => r.id !== id)); setIsDetailOpen(false); };

    const actions: RowAction<ReviewAdminItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (r) => { setSelected(r); setIsDetailOpen(true); } },
        { label: "Marcar/Desmarcar", icon: <Flag className="h-4 w-4" />, onClick: (r) => handleFlag(r.id) },
        { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: (r) => handleDelete(r.id), variant: "destructive" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gestion de Resenas</h1>
                <p className="text-muted-foreground">Moderacion de resenas y calificaciones de productos</p>
            </div>
            <AdminDataTable
                data={paginated} columns={columns} actions={actions} keyExtractor={(r) => r.id}
                isLoading={isLoading} searchValue={search} onSearchChange={setSearch}
                searchPlaceholder="Buscar por producto o usuario..."
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
                        <Select value={flagFilter} onValueChange={setFlagFilter}>
                            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="flagged">Reportados</SelectItem>
                                <SelectItem value="clean">Sin reportar</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                }
            />
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Detalle de Resena</DialogTitle><DialogDescription>Revision y moderacion</DialogDescription></DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Producto</p><p className="font-medium">{selected.productName}</p></div>
                                <div><p className="text-muted-foreground">Usuario</p><p className="font-medium">{selected.userName}</p></div>
                                <div><p className="text-muted-foreground">Calificacion</p><StarRating rating={selected.rating} /></div>
                                <div><p className="text-muted-foreground">Estado</p>{selected.isFlagged ? <StatusBadge label="Reportado" variant="destructive" /> : <StatusBadge label="OK" variant="success" />}</div>
                            </div>
                            <Separator />
                            {selected.title && <div><p className="text-muted-foreground">Titulo</p><p className="font-medium">{selected.title}</p></div>}
                            <div><p className="text-muted-foreground">Comentario</p><p>{selected.comment ?? "Sin comentario"}</p></div>
                            <div className="flex justify-end gap-2">
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(selected.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
