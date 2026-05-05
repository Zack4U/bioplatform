"use client";

/**
 * ImagesManagement — admin page for species images with validation.
 */

import { StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/common";
import { Pagination } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { mockImages } from "@/lib/admin-mock";
import type { ImageAdminItem } from "@/types";
import { Check, Image as ImageIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function ImagesManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [images, setImages] = useState<ImageAdminItem[]>([]);
    const [search, setSearch] = useState("");
    const [validationFilter, setValidationFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<ImageAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const pageSize = 12;

    useEffect(() => { const t = setTimeout(() => { setImages(mockImages()); setIsLoading(false); }, 400); return () => clearTimeout(t); }, []);

    const filtered = useMemo(() => {
        let r = [...images];
        if (search) { const q = search.toLowerCase(); r = r.filter((i) => i.speciesName.toLowerCase().includes(q) || (i.uploaderName?.toLowerCase().includes(q) ?? false)); }
        if (validationFilter === "validated") r = r.filter((i) => i.isValidatedByExpert);
        if (validationFilter === "pending") r = r.filter((i) => !i.isValidatedByExpert);
        return r;
    }, [images, search, validationFilter]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleValidate = (id: string) => {
        setImages((prev) => prev.map((img) => img.id === id ? { ...img, isValidatedByExpert: true, validatedByName: "Admin", validationDate: new Date().toISOString() } : img));
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div><Skeleton className="h-8 w-64" /><Skeleton className="h-5 w-96 mt-2" /></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-lg" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gestion de Imagenes</h1>
                <p className="text-muted-foreground">Validacion y gestion de imagenes de especies</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput value={search} onChange={setSearch} placeholder="Buscar por especie o autor..." className="sm:max-w-xs" />
                <Select value={validationFilter} onValueChange={setValidationFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="validated">Validadas</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {filtered.length === 0 ? (
                <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" /><p className="text-lg font-semibold">Sin imagenes</p>
                </CardContent></Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {paginated.map((img) => (
                        <Card key={img.id} className="group overflow-hidden pt-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelected(img); setIsDetailOpen(true); }}>
                            <div className="relative aspect-[4/3] bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.imageUrl} alt={img.speciesName} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                                <div className="absolute top-2 right-2">
                                    <StatusBadge label={img.isValidatedByExpert ? "Validada" : "Pendiente"} variant={img.isValidatedByExpert ? "success" : "warning"} />
                                </div>
                            </div>
                            <CardContent className="p-3">
                                <p className="text-sm font-medium truncate italic">{img.speciesName}</p>
                                <p className="text-xs text-muted-foreground truncate">{img.uploaderName ?? "Anonimo"}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalle de Imagen</DialogTitle>
                        <DialogDescription>Revision y validacion de imagen</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={selected.imageUrl} alt={selected.speciesName} className="h-full w-full object-contain" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-muted-foreground">Especie</p><p className="font-medium italic">{selected.speciesName}</p></div>
                                <div><p className="text-muted-foreground">Subido por</p><p className="font-medium">{selected.uploaderName ?? "Anonimo"}</p></div>
                                <div><p className="text-muted-foreground">Licencia</p><Badge variant="outline">{selected.licenseType}</Badge></div>
                                <div><p className="text-muted-foreground">Estado</p><StatusBadge label={selected.isValidatedByExpert ? "Validada" : "Pendiente"} variant={selected.isValidatedByExpert ? "success" : "warning"} /></div>
                                {selected.validatedByName && <div><p className="text-muted-foreground">Validada por</p><p className="font-medium">{selected.validatedByName}</p></div>}
                            </div>
                            <div className="flex justify-end gap-2">
                                {!selected.isValidatedByExpert && (
                                    <Button onClick={() => { handleValidate(selected.id); setIsDetailOpen(false); }}>
                                        <Check className="mr-2 h-4 w-4" />Validar
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
