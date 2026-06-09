"use client";
/**
 * OrdersManagement — orders administration. Connected to real API.
 */
import { useState, useCallback } from "react";
import { StatusBadge, getOrderStatusVariant } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, ORDER_STATUS, ORDER_STATUS_LABELS, translateLabel } from "@/lib/constants";
import type { OrderAdminItem } from "@/types/admin";
import { AlertCircle, Eye, ShoppingCart } from "lucide-react";
import { useOrdersList, useUpdateOrderStatus } from "@/hooks/features/admin/useOrdersManagement";
import { useHasRole } from "@/hooks/features/auth";
import { getAdminOrderById } from "@/services/admin-service";
import { useQuery } from "@tanstack/react-query";
import type { OrderAdminDetail } from "@/types/admin";

const columns: ColumnDef<OrderAdminItem>[] = [
    { key: "orderNumber", header: "Orden", sortable: true, render: (o) => <span className="font-medium font-mono text-xs">{o.orderNumber}</span> },
    { key: "buyerName", header: "Comprador", render: (o) => <span>{o.buyerName}<span className="block text-xs text-muted-foreground">{o.buyerEmail}</span></span> },
    { key: "totalAmount", header: "Total", sortable: true, render: (o) => <span className="font-semibold">{formatCurrency(o.totalAmount)}</span> },
    { key: "status", header: "Estado", render: (o) => <StatusBadge label={translateLabel(ORDER_STATUS_LABELS, o.status)} variant={getOrderStatusVariant(o.status)} /> },
    { key: "paymentMethod", header: "Pago", hideOnMobile: true, render: (o) => o.paymentMethod },
    { key: "itemCount", header: "Items", hideOnMobile: true, render: (o) => o.itemCount },
    { key: "createdAt", header: "Fecha", hideOnMobile: true, render: (o) => new Date(o.createdAt).toLocaleDateString("es-CO") },
];

const NEXT_STATUSES: Record<string, string[]> = {
    Pending:    ["Processing", "Cancelled"],
    Processing: ["Shipped", "Cancelled"],
    Shipped:    ["Delivered"],
    Delivered:  [],
    Cancelled:  [],
};

export function OrdersManagement() {
    const isAdmin = useHasRole("ADMIN");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selected, setSelected] = useState<OrderAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const { data, isLoading, isError, error } = useOrdersList({
        status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
        page,
        pageSize: 15,
    });

    const { data: orderDetail, isLoading: isLoadingDetail } = useQuery<OrderAdminDetail>({
        queryKey: ["admin", "order-detail", selected?.id],
        queryFn: () => getAdminOrderById(selected!.id),
        enabled: isDetailOpen && !!selected?.id,
        staleTime: 30_000,
    });

    const updateStatus = useUpdateOrderStatus();
    const items = data?.items ?? [];
    const totalPages = data?.totalPages ?? 1;

    const is403 = isError && (error as { response?: { status?: number } })?.response?.status === 403;

    const handleSort = useCallback((key: string) => {
        setSortBy((prev) => {
            if (prev === key) { setSortOrder((o) => o === "asc" ? "desc" : "asc"); return prev; }
            setSortOrder("asc"); return key;
        });
    }, []);

    const actions: RowAction<OrderAdminItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (o) => { setSelected(o); setIsDetailOpen(true); } },
    ];

    if (is403) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="text-sm">No tienes permisos para ver las ordenes.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Órdenes</h1>
                <p className="text-muted-foreground">Gestión de órdenes del marketplace</p>
            </div>

            <AdminDataTable
                data={items} columns={columns} actions={actions} keyExtractor={(o) => o.id}
                isLoading={isLoading} searchValue={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                searchPlaceholder="Buscar por número de orden o comprador..."
                sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}
                currentPage={page} totalPages={totalPages} onPageChange={setPage}
                emptyTitle="No hay órdenes" emptyIcon={<ShoppingCart className="h-6 w-6" />}
                toolbar={
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            {Object.entries(ORDER_STATUS).map(([k, v]) => (
                                <SelectItem key={k} value={v}>{translateLabel(ORDER_STATUS_LABELS, v)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                }
            />

            {/* Detail + status update dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Orden #{selected?.orderNumber}</DialogTitle>
                        <DialogDescription>Detalle y gestión del estado de la orden</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-muted-foreground">Comprador</p>
                                    <p className="font-medium">{selected.buyerName || "—"}</p>
                                    <p className="text-xs text-muted-foreground">{selected.buyerEmail || ""}</p>
                                </div>
                                <div><p className="text-muted-foreground">Estado</p><StatusBadge label={translateLabel(ORDER_STATUS_LABELS, selected.status)} variant={getOrderStatusVariant(selected.status)} /></div>
                                <div><p className="text-muted-foreground">Método de pago</p><p className="font-medium">{selected.paymentMethod || "—"}</p></div>
                                {selected.transactionRef && <div><p className="text-muted-foreground">Ref. transacción</p><p className="font-mono text-xs">{selected.transactionRef}</p></div>}
                            </div>
                            <Separator />
                            {/* Line items */}
                            {isLoadingDetail ? (
                                <p className="text-xs text-muted-foreground italic">Cargando items...</p>
                            ) : orderDetail?.items && orderDetail.items.length > 0 ? (
                                <div>
                                    <p className="text-muted-foreground font-medium mb-2">Items ({orderDetail.items.length})</p>
                                    <div className="divide-y rounded-md border">
                                        {orderDetail.items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between px-3 py-2">
                                                <div>
                                                    <p className="font-medium">{item.productName}</p>
                                                    <p className="text-xs text-muted-foreground">x{item.quantity} · {formatCurrency(item.unitPrice)} c/u</p>
                                                </div>
                                                <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">{selected.itemCount} item(s) en esta orden.</p>
                            )}
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Subtotal</p><p className="font-medium">{formatCurrency(selected.subtotalAmount)}</p></div>
                                <div><p className="text-muted-foreground">Impuesto</p><p className="font-medium">{formatCurrency(selected.taxAmount)}</p></div>
                                <div><p className="text-muted-foreground">Envío</p><p className="font-medium">{formatCurrency(selected.shippingAmount)}</p></div>
                                <div><p className="text-muted-foreground">Total</p><p className="font-semibold text-base">{formatCurrency(selected.totalAmount)}</p></div>
                            </div>
                            {isAdmin && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-muted-foreground mb-2 font-medium">Cambiar estado</p>
                                        {(NEXT_STATUSES[selected.status] ?? []).length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">No hay transiciones disponibles para este estado.</p>
                                        ) : (
                                            <div className="flex gap-2 flex-wrap">
                                                {(NEXT_STATUSES[selected.status] ?? []).map((s) => (
                                                    <Button
                                                        key={s} size="sm" variant="outline"
                                                        disabled={updateStatus.isPending}
                                                        onClick={async () => {
                                                            await updateStatus.mutateAsync({ id: selected.id, status: s });
                                                            setIsDetailOpen(false);
                                                        }}
                                                    >
                                                        → {translateLabel(ORDER_STATUS_LABELS, s)}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
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
        </div>
    );
}
