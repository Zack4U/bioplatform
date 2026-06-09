/**
 * CheckoutPaymentStep — Step 3: Final review + payment submission.
 *
 * Shows order summary items, selected shipping address, order notes input,
 * and a "Proceder al pago seguro" button that triggers the real checkout session.
 *
 * Integrates with Stripe Embedded Checkout.
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/constants";
import type { Address, CartItem, OrderSummaryData } from "@/types/marketplace";
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Leaf,
  Lock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CheckoutPaymentStepProps {
  selectedItems: CartItem[];
  orderSummary: OrderSummaryData;
  shippingAddress: Address | null;
  orderNotes: string;
  onOrderNotesChange: (notes: string) => void;
  onBack: () => void;
  /** Triggers createOrder + createCheckoutSession → redirects to Stripe */
  onSubmitOrder: () => void;
  /** True while the order and checkout session requests are in-flight */
  isSubmittingOrder: boolean;
  /** Human-readable error message returned by the API, or null */
  submitOrderError?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CheckoutPaymentStep({
  selectedItems,
  orderSummary,
  shippingAddress,
  orderNotes,
  onOrderNotesChange,
  onBack,
  onSubmitOrder,
  isSubmittingOrder,
  submitOrderError,
}: CheckoutPaymentStepProps) {

  return (
    <div className="space-y-6">
      {/* ── API error banner ────────────────────────────────────── */}
      {submitOrderError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{submitOrderError}</span>
        </div>
      )}

      {/* ── Order review ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Resumen del pedido</h2>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          {selectedItems.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden bg-muted">
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={`Miniatura de ${item.name}`}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Leaf
                      className="h-4 w-4 text-muted-foreground/40"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Cantidad: {item.quantity}
                </p>
              </div>
              <span className="text-sm font-medium shrink-0">
                {formatCurrency(item.sellPrice * item.quantity)}
              </span>
            </div>
          ))}

          {selectedItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay artículos seleccionados.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Shipping address summary ─────────────────────────────── */}
      {shippingAddress && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              Enviar a
            </h2>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <address className="text-sm space-y-1 not-italic">
              <p className="font-medium">{shippingAddress.recipientName}</p>
              <p className="text-muted-foreground">
                {shippingAddress.streetLine1}
                {shippingAddress.streetLine2 &&
                  `, ${shippingAddress.streetLine2}`}
              </p>
              <p className="text-muted-foreground">
                {shippingAddress.city}, {shippingAddress.department}
                {shippingAddress.postalCode &&
                  `, ${shippingAddress.postalCode}`}
              </p>
              <p className="text-muted-foreground">{shippingAddress.phoneNumber}</p>
            </address>
          </CardContent>
        </Card>
      )}

      {/* ── Order notes ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <Label htmlFor="order-notes" className="text-lg font-semibold">
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
            disabled={isSubmittingOrder}
            aria-label="Notas opcionales para el pedido"
          />
        </CardContent>
      </Card>

      {/* ── Payment section ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
            Método de pago
          </h2>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="rounded-lg border-2 border-dashed border-muted p-8 text-center space-y-3">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <ShieldCheck
                  className="h-8 w-8 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </div>
            <p className="text-sm font-medium">
              Pago seguro vía Stripe
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Al confirmar tu pedido podrás ingresar los datos de tu tarjeta
              de forma segura para completar la transacción.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Pago seguro con cifrado SSL
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmittingOrder}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Button>
        <Button
          onClick={onSubmitOrder}
          disabled={isSubmittingOrder || selectedItems.length === 0}
          size="lg"
          className="gap-2"
        >
          {isSubmittingOrder ? (
            <>
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                role="status"
                aria-label="Procesando pedido..."
              />
              Procesando...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" aria-hidden="true" />
              Proceder al pago seguro — {formatCurrency(orderSummary.total)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
