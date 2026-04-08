/**
 * CheckoutPaymentStep — Step 3: Final review + payment placeholder.
 *
 * Shows order summary, selected address, notes, and a Stripe payment placeholder.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/constants";
import type {
    Address,
    CartItem,
    OrderSummaryData,
} from "@/types/marketplace";
import {
    ArrowLeft,
    CreditCard,
    Leaf,
    Lock,
    MapPin,
    ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface CheckoutPaymentStepProps {
    selectedItems: CartItem[];
    orderSummary: OrderSummaryData;
    shippingAddress: Address | null;
    orderNotes: string;
    onOrderNotesChange: (notes: string) => void;
    onBack: () => void;
}

export function CheckoutPaymentStep({
    selectedItems,
    orderSummary,
    shippingAddress,
    orderNotes,
    onOrderNotesChange,
    onBack,
}: CheckoutPaymentStepProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePlaceOrder = () => {
        setIsProcessing(true);
        // Simulated — in production this would integrate with Stripe
        setTimeout(() => {
            setIsProcessing(false);
            alert(
                "🎉 ¡Pedido realizado exitosamente! (Demo — integración con Stripe pendiente)",
            );
        }, 2000);
    };

    return (
        <div className="space-y-6">
            {/* Order review */}
            <Card>
                <CardHeader className="pb-3">
                    <h2 className="text-lg font-semibold">
                        Resumen del pedido
                    </h2>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 space-y-3">
                    {selectedItems.map((item) => (
                        <div
                            key={item.productId}
                            className="flex items-center gap-3"
                        >
                            <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden bg-muted">
                                {item.thumbnailUrl ? (
                                    <Image
                                        src={item.thumbnailUrl}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="40px"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Leaf className="h-4 w-4 text-muted-foreground/40" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-1">
                                    {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Cantidad: {item.quantity}
                                </p>
                            </div>
                            <span className="text-sm font-medium shrink-0">
                                {formatCurrency(item.price * item.quantity)}
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Shipping address summary */}
            {shippingAddress && (
                <Card>
                    <CardHeader className="pb-3">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Enviar a
                        </h2>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                        <div className="text-sm space-y-1">
                            <p className="font-medium">
                                {shippingAddress.fullName}
                            </p>
                            <p className="text-muted-foreground">
                                {shippingAddress.addressLine1}
                                {shippingAddress.addressLine2 &&
                                    `, ${shippingAddress.addressLine2}`}
                            </p>
                            <p className="text-muted-foreground">
                                {shippingAddress.city},{" "}
                                {shippingAddress.department},{" "}
                                {shippingAddress.postalCode}
                            </p>
                            <p className="text-muted-foreground">
                                {shippingAddress.phone}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Order notes */}
            <Card>
                <CardHeader className="pb-3">
                    <Label
                        htmlFor="order-notes"
                        className="text-lg font-semibold"
                    >
                        Notas del pedido
                    </Label>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    <Input
                        id="order-notes"
                        placeholder="Instrucciones especiales de entrega, comentarios, etc."
                        value={orderNotes}
                        onChange={(e) => onOrderNotesChange(e.target.value)}
                    />
                </CardContent>
            </Card>

            {/* Payment (placeholder) */}
            <Card>
                <CardHeader className="pb-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Método de pago
                    </h2>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    <div className="rounded-lg border-2 border-dashed border-muted p-8 text-center space-y-3">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-muted p-4">
                                <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </div>
                        <p className="text-sm font-medium">
                            Integración con Stripe
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            El formulario de pago seguro con tarjeta de crédito/débito
                            se integrará aquí mediante Stripe Elements.
                        </p>
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            Pago seguro con cifrado SSL
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={onBack} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Button>
                <Button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    size="lg"
                    className="gap-2"
                >
                    {isProcessing ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            Procesando...
                        </>
                    ) : (
                        <>
                            <Lock className="h-4 w-4" />
                            Confirmar pedido —{" "}
                            {formatCurrency(orderSummary.total)}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
