/**
 * OrderSummaryWidget — sticky sidebar with order totals.
 *
 * Shows subtotal, shipping, discounts, coupon input, and total.
 * Prices already include IVA — shown as informational note.
 * Sticks to the right column on desktop.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import type { OrderSummaryData } from "@/types/marketplace";
import { Info, Percent, Tag, Truck, X } from "lucide-react";
import { useState } from "react";

interface OrderSummaryWidgetProps {
    orderSummary: OrderSummaryData;
    onApplyCoupon: (code: string) => Promise<void>;
    onRemoveCoupon: () => void;
    couponLoading: boolean;
    couponError: string | null;
}

export function OrderSummaryWidget({
    orderSummary,
    onApplyCoupon,
    onRemoveCoupon,
    couponLoading,
    couponError,
}: OrderSummaryWidgetProps) {
    const [couponInput, setCouponInput] = useState("");

    const handleApply = async () => {
        if (!couponInput.trim()) return;
        await onApplyCoupon(couponInput.trim());
        setCouponInput("");
    };

    return (
        <Card className="sticky top-24">
            <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold">Resumen del pedido</h3>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        Subtotal ({orderSummary.itemCount} articulo
                        {orderSummary.itemCount !== 1 ? "s" : ""})
                    </span>
                    <span className="font-medium">
                        {formatCurrency(orderSummary.subtotal)}
                    </span>
                </div>

                {/* IVA - informational */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <Info className="h-3.5 w-3.5" />
                        IVA (incluido)
                    </span>
                    <span className="text-muted-foreground">
                        {formatCurrency(orderSummary.taxAmount)}
                    </span>
                </div>

                {/* Discount */}
                {orderSummary.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Percent className="h-3.5 w-3.5" />
                            Descuento
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                            -{formatCurrency(orderSummary.discountAmount)}
                        </span>
                    </div>
                )}

                {/* Shipping */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" />
                        Envio
                    </span>
                    {orderSummary.shippingAmount === 0 ? (
                        <Badge
                            variant="outline"
                            className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                        >
                            Gratis
                        </Badge>
                    ) : (
                        <span className="font-medium">
                            {formatCurrency(orderSummary.shippingAmount)}
                        </span>
                    )}
                </div>

                {orderSummary.shippingAmount > 0 && (
                    <p className="text-xs text-muted-foreground">
                        Envio gratis en compras mayores a{" "}
                        {formatCurrency(FREE_SHIPPING_THRESHOLD)}
                    </p>
                )}

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">
                        {formatCurrency(orderSummary.total)}
                    </span>
                </div>

                <Separator />

                {/* Coupon */}
                {orderSummary.coupon ? (
                    <div className="flex items-center justify-between rounded-lg border border-dashed border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 p-3">
                        <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <div>
                                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                    {orderSummary.coupon.code}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-500">
                                    {orderSummary.coupon.description}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={onRemoveCoupon}
                            aria-label="Eliminar cupon"
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Codigo de cupon"
                                value={couponInput}
                                onChange={(e) =>
                                    setCouponInput(e.target.value.toUpperCase())
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleApply()
                                }
                                className="h-9 text-sm uppercase"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleApply}
                                disabled={
                                    couponLoading || !couponInput.trim()
                                }
                                className="shrink-0"
                            >
                                {couponLoading ? "..." : "Aplicar"}
                            </Button>
                        </div>
                        {couponError && (
                            <p className="text-xs text-destructive">
                                {couponError}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Prueba: BIO10, CALDAS5000
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
