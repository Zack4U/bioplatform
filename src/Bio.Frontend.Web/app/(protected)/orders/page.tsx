/**
 * My Orders page — shows the authenticated user's order history.
 *
 * @route /orders
 */

"use client";

import { LoadingSpinner } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useMyOrders } from "@/hooks/features/marketplace";
import { formatCurrency } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import type { Order } from "@/types";
import {
    ChevronDown,
    ChevronRight,
    Package,
    ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const STATUS_LABELS: Record<string, string> = {
    Pending: "Pendiente",
    Confirmed: "Confirmado",
    Processing: "Procesando",
    Shipped: "Enviado",
    Delivered: "Entregado",
    Cancelled: "Cancelado",
    Refunded: "Reembolsado",
};

const STATUS_VARIANTS: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
> = {
    Pending: "secondary",
    Confirmed: "default",
    Processing: "default",
    Shipped: "default",
    Delivered: "default",
    Cancelled: "destructive",
    Refunded: "outline",
};

function OrderCard({ order }: { order: Order }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card className="overflow-hidden">
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-mono text-sm">
                                        #{order.id.slice(0, 8).toUpperCase()}
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    {formatDate(order.createdAt)} ·{" "}
                                    {order.items?.length ?? 0} producto
                                    {(order.items?.length ?? 0) !== 1 ? "s" : ""}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="font-semibold">
                                        {formatCurrency(order.totalAmount)}
                                    </p>
                                    <Badge
                                        variant={
                                            STATUS_VARIANTS[order.status] ?? "secondary"
                                        }
                                        className="mt-1 text-xs"
                                    >
                                        {STATUS_LABELS[order.status] ?? order.status}
                                    </Badge>
                                </div>
                                {expanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <Separator />
                    <CardContent className="pt-4">
                        {order.items && order.items.length > 0 ? (
                            <div className="space-y-3">
                                {order.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {item.productName}
                                            </span>
                                            <span className="text-muted-foreground">
                                                × {item.quantity}
                                            </span>
                                        </div>
                                        <span className="font-medium">
                                            {formatCurrency(item.unitPrice * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                                <Separator className="my-2" />
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Total</span>
                                    <span>{formatCurrency(order.totalAmount)}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Sin detalles disponibles.
                            </p>
                        )}

                        {order.shippingAddress && (
                            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                                <p className="font-medium mb-1">Direccion de envio</p>
                                <p className="text-muted-foreground">
                                    {order.shippingAddress.streetLine1}
                                    {order.shippingAddress.streetLine2
                                        ? `, ${order.shippingAddress.streetLine2}`
                                        : ""}
                                    <br />
                                    {order.shippingAddress.city},{" "}
                                    {order.shippingAddress.department}{" "}
                                    {order.shippingAddress.postalCode}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

export default function OrdersPage() {
    const { orders, isLoading, isError, totalPages, page, setPage } =
        useMyOrders(10);

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Mis Pedidos</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Historial de todas tus compras en BioCommerce
                </p>
            </div>

            {isLoading && (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            )}

            {isError && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    Error al cargar tus pedidos. Intenta de nuevo.
                </p>
            )}

            {!isLoading && !isError && orders.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-16">
                    <div className="rounded-full bg-muted p-6">
                        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-semibold">Sin pedidos todavia</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Cuando realices una compra aparecera aqui.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/marketplace">Ir al marketplace</Link>
                    </Button>
                </div>
            )}

            {!isLoading && orders.length > 0 && (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                            >
                                Anterior
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages}
                            >
                                Siguiente
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
