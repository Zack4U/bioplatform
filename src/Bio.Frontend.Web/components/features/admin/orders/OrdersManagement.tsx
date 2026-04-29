"use client";

/**
 * OrdersManagement — orders administration page.
 */

import { StatusBadge, getOrderStatusVariant } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, ORDER_STATUS, ORDER_STATUS_LABELS, translateLabel } from "@/lib/constants";
import { mockOrders } from "@/lib/admin-mock";
import type { OrderAdminItem } from "@/types";
import { Eye, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const columns: ColumnDef<OrderAdminItem>[] = [
    { key: "orderNumber", header: "Orden", sortable: true, render: (o) => <span className="font-medium font-mono text-xs">{o.orderNumber}</span> },
    { key: "buyerName", header: "Comprador", render: (o) => o.buyerName },
    { key: "totalAmount", header: "Total", sortable: true, render: (o) => formatCurrency(o.totalAmount) },
    { key: "status", header: "Estado", render: (o) => <StatusBadge label={translateLabel(ORDER_STATUS_LABELS, o.status)} variant={getOrderStatusVariant(o.status)} /> },
    { key: "paymentMethod", header: "Pago", hideOnMobile: true, render: (o) => o.paymentMethod },
    { key: "itemCount", header: "Items", hideOnMobile: true, render: (o) => o.itemCount },
    { key: "createdAt", header: "Fecha", hideOnMobile: true, render: (o) => new Date(o.createdAt).toLocaleDateString("es-CO") },
];

export function OrdersManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState<OrderAdminItem[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selected, setSelected] = useState<OrderAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => { const t = setTimeout(() => { setOrders(mockOrders()); setIsLoading(false); }, 400); return () => clearTimeout(t); }, []);

    const filtered = useMemo(() => {
        let r = [...orders];
        if (search) { const q = search.toLowerCase(); r = r.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.buyerName.toLowerCase().includes(q)); }
        if (statusFilter && statusFilter !== "all") r = r.filter((o) => o.status === statusFilter);
        r.sort((a, b) => {
            const av = sortBy === "totalAmount" ? a.totalAmount : sortBy === "createdAt" ? a.createdAt : String((a as unknown as Record<string, unknown>)[sortBy] ?? "");
            const bv = sortBy === "totalAmount" ? b.totalAmount : sortBy === "createdAt" ? b.createdAt : String((b as unknown as Record<string, unknown>)[sortBy] ?? "");
            const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
            return sortOrder === "asc" ? cmp : -cmp;
        });
        return r;
    }, [orders, search, statusFilter, sortBy, sortOrder]);

    const totalPages = Math.ceil(filtered.length / 15);
    const paginated = filtered.slice((page - 1) * 15, page * 15);
    const handleSort = (key: string) => { setSortBy((p) => { if (p === key) { setSortOrder((o) => o === "asc" ? "desc" : "asc"); return p; } setSortOrder("asc"); return key; }); };

    const actions: RowAction<OrderAdminItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (o) => { setSelected(o); setIsDetailOpen(true); } },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gestion de Ordenes</h1>
                <p className="text-muted-foreground">Seguimiento y administracion de ordenes del marketplace</p>
            </div>
            <AdminDataTable
                data={paginated} columns={columns} actions={actions} keyExtractor={(o) => o.id}
                isLoading={isLoading} searchValue={search} onSearchChange={setSearch}
                searchPlaceholder="Buscar por numero de orden o comprador..."
                sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}
                currentPage={page} totalPages={totalPages} onPageChange={setPage}
                emptyTitle="No hay ordenes" emptyIcon={<ShoppingCart className="h-6 w-6" />}
                toolbar={
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {Object.entries(ORDER_STATUS).map(([k, v]) => <SelectItem key={k} value={v}>{translateLabel(ORDER_STATUS_LABELS, v)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                }
            />
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Detalle de Orden</DialogTitle><DialogDescription>Informacion completa de la orden</DialogDescription></DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Numero</p><p className="font-medium font-mono">{selected.orderNumber}</p></div>
                                <div><p className="text-muted-foreground">Estado</p><StatusBadge label={translateLabel(ORDER_STATUS_LABELS, selected.status)} variant={getOrderStatusVariant(selected.status)} /></div>
                                <div><p className="text-muted-foreground">Comprador</p><p className="font-medium">{selected.buyerName}</p></div>
                                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selected.buyerEmail}</p></div>
                                <div><p className="text-muted-foreground">Metodo de Pago</p><p className="font-medium">{selected.paymentMethod}</p></div>
                                <div><p className="text-muted-foreground">Referencia</p><p className="font-medium font-mono">{selected.transactionRef ?? "-"}</p></div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Subtotal</p><p className="font-medium">{formatCurrency(selected.subtotalAmount)}</p></div>
                                <div><p className="text-muted-foreground">IVA</p><p className="font-medium">{formatCurrency(selected.taxAmount)}</p></div>
                                <div><p className="text-muted-foreground">Envio</p><p className="font-medium">{formatCurrency(selected.shippingAmount)}</p></div>
                                <div><p className="text-muted-foreground">Descuento</p><p className="font-medium">-{formatCurrency(selected.discountAmount)}</p></div>
                            </div>
                            <div className="flex items-center justify-between border-t pt-3"><span className="font-semibold">Total</span><span className="text-lg font-bold">{formatCurrency(selected.totalAmount)}</span></div>
                            <div className="flex justify-end"><Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button></div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
