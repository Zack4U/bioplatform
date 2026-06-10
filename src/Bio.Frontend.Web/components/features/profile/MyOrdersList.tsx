/**
 * MyOrdersList — shows the user's order history in the profile tab.
 * Displays products, prices, status and shipping address per order.
 *
 * @module components/features/profile/MyOrdersList
 */

"use client";

import { LoadingSpinner, Pagination, StatusBadge, getOrderStatusVariant } from "@/components/common";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useMyOrders } from "@/hooks/features/marketplace";
import { formatCurrency, ORDER_STATUS_LABELS, translateLabel } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import type { Order } from "@/types";
import { ChevronDown, ChevronRight, Package, ShoppingBag } from "lucide-react";
import { useState } from "react";

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
                                        {order.orderNumber}
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
                                    <StatusBadge
                                        label={translateLabel(ORDER_STATUS_LABELS, order.status)}
                                        variant={getOrderStatusVariant(order.status)}
                                        className="mt-1 text-xs"
                                    />
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
                    <CardContent className="pt-4 space-y-4">
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
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Sin detalles disponibles.
                            </p>
                        )}

                        <Separator />

                        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                            <div>
                                <p className="text-muted-foreground">Subtotal</p>
                                <p className="font-medium">{formatCurrency(order.subtotalAmount)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Impuesto</p>
                                <p className="font-medium">{formatCurrency(order.taxAmount)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Envío</p>
                                <p className="font-medium">{formatCurrency(order.shippingAmount)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                            </div>
                        </div>

                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                            <div>
                                <p className="text-muted-foreground">Método de pago</p>
                                <p className="font-medium">{order.paymentMethod || "—"}</p>
                            </div>
                            {order.transactionRef && (
                                <div>
                                    <p className="text-muted-foreground">Ref. transacción</p>
                                    <p className="font-mono text-xs">{order.transactionRef}</p>
                                </div>
                            )}
                        </div>

                        {order.shippingAddress && (
                            <div className="rounded-lg bg-muted/50 p-3 text-sm">
                                <p className="font-medium mb-1">Dirección de envío</p>
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

export function MyOrdersList() {
    const { orders, isLoading, isError, totalPages, page, setPage } = useMyOrders(8);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (isError) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                Error al cargar tus pedidos. Intenta de nuevo.
            </p>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 py-16">
                <div className="rounded-full bg-muted p-6">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <h3 className="font-semibold">Sin pedidos todavía</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Cuando realices una compra aparecerá aquí.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Mis Pedidos</h2>
                <p className="text-sm text-muted-foreground">
                    Historial de todas tus compras en BioCommerce
                </p>
            </div>

            <div className="space-y-4">
                {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>

            {totalPages > 1 && (
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}
        </div>
    );
}
