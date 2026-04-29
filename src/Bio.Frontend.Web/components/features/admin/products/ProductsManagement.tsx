"use client";

/**
 * ProductsManagement — admin page for marketplace products.
 */

import { StatusBadge, getProductStatusVariant } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/constants";
import { mockProducts } from "@/lib/admin-mock";
import type { ProductAdminItem } from "@/types";
import { Eye, Package, Power, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const columns: ColumnDef<ProductAdminItem>[] = [
    { key: "name", header: "Producto", sortable: true, render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "entrepreneurName", header: "Emprendedor", hideOnMobile: true, render: (p) => p.entrepreneurName },
    { key: "categoryName", header: "Categoria", hideOnMobile: true, render: (p) => p.categoryName ?? "-" },
    { key: "price", header: "Precio", sortable: true, render: (p) => formatCurrency(p.price) },
    { key: "stockQuantity", header: "Stock", render: (p) => p.stockQuantity },
    { key: "isActive", header: "Estado", render: (p) => <StatusBadge label={p.isActive ? "Activo" : "Inactivo"} variant={p.isActive ? "success" : "destructive"} /> },
    { key: "rating", header: "Rating", hideOnMobile: true, render: (p) => p.rating != null ? <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning fill-warning" />{p.rating.toFixed(1)}</span> : "-" },
];

export function ProductsManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<ProductAdminItem[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [selected, setSelected] = useState<ProductAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => { const t = setTimeout(() => { setProducts(mockProducts()); setIsLoading(false); }, 400); return () => clearTimeout(t); }, []);

    const filtered = useMemo(() => {
        let r = [...products];
        if (search) { const q = search.toLowerCase(); r = r.filter((p) => p.name.toLowerCase().includes(q) || p.entrepreneurName.toLowerCase().includes(q)); }
        if (statusFilter === "active") r = r.filter((p) => p.isActive);
        if (statusFilter === "inactive") r = r.filter((p) => !p.isActive);
        r.sort((a, b) => { const av = sortBy === "price" ? a.price : String((a as unknown as Record<string, unknown>)[sortBy] ?? ""); const bv = sortBy === "price" ? b.price : String((b as unknown as Record<string, unknown>)[sortBy] ?? ""); const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv)); return sortOrder === "asc" ? cmp : -cmp; });
        return r;
    }, [products, search, statusFilter, sortBy, sortOrder]);

    const totalPages = Math.ceil(filtered.length / 15);
    const paginated = filtered.slice((page - 1) * 15, page * 15);
    const handleSort = useCallback((key: string) => { setSortBy((p) => { if (p === key) { setSortOrder((o) => o === "asc" ? "desc" : "asc"); return p; } setSortOrder("asc"); return key; }); }, []);

    const actions: RowAction<ProductAdminItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (p) => { setSelected(p); setIsDetailOpen(true); } },
        { label: "Cambiar estado", icon: <Power className="h-4 w-4" />, onClick: (p) => setProducts((prev) => prev.map((pr) => pr.id === p.id ? { ...pr, isActive: !pr.isActive } : pr)) },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gestion de Productos</h1>
                <p className="text-muted-foreground">Productos del marketplace de biocomercio</p>
            </div>
            <AdminDataTable
                data={paginated} columns={columns} actions={actions} keyExtractor={(p) => p.id}
                isLoading={isLoading} searchValue={search} onSearchChange={setSearch}
                searchPlaceholder="Buscar por producto o emprendedor..."
                sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}
                currentPage={page} totalPages={totalPages} onPageChange={setPage}
                emptyTitle="No hay productos" emptyIcon={<Package className="h-6 w-6" />}
                toolbar={
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Activos</SelectItem>
                            <SelectItem value="inactive">Inactivos</SelectItem>
                        </SelectContent>
                    </Select>
                }
            />
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Detalle de Producto</DialogTitle><DialogDescription>Informacion completa del producto</DialogDescription></DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Nombre</p><p className="font-medium">{selected.name}</p></div>
                                <div><p className="text-muted-foreground">SKU</p><p className="font-medium">{selected.sku}</p></div>
                                <div><p className="text-muted-foreground">Emprendedor</p><p className="font-medium">{selected.entrepreneurName}</p></div>
                                <div><p className="text-muted-foreground">Categoria</p><p className="font-medium">{selected.categoryName ?? "-"}</p></div>
                                <div><p className="text-muted-foreground">Precio</p><p className="font-medium">{formatCurrency(selected.price)}</p></div>
                                <div><p className="text-muted-foreground">Stock</p><p className="font-medium">{selected.stockQuantity}</p></div>
                                <div><p className="text-muted-foreground">Estado</p><StatusBadge label={selected.isActive ? "Activo" : "Inactivo"} variant={selected.isActive ? "success" : "destructive"} /></div>
                                <div><p className="text-muted-foreground">Certificaciones</p><p className="font-medium">{selected.certificationCount}</p></div>
                            </div>
                            <Separator />
                            <div className="flex justify-end"><Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button></div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
