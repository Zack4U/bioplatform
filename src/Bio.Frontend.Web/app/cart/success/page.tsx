/**
 * /cart/success — Post-payment confirmation page.
 *
 * Stripe redirects here after a successful payment with:
 *   ?orderId=<uuid>&payment=success&session_id=<stripe_session_id>
 *
 * What this page does:
 *   1. Reads orderId from the URL search params.
 *   2. Fetches the order from the backend to display confirmed details.
 *   3. Shows a premium animated confirmation with order summary.
 *   4. Cart is already cleared by useCheckout before the Stripe redirect.
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/constants";
import { getOrderById } from "@/services/marketplace-service";
import type { Order } from "@/types/marketplace";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Leaf,
  Loader2,
  MapPin,
  Package,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const paymentStatus = searchParams.get("payment");

  /* ── Fetch order from API ──────────────────────────────────────────── */
  const {
    data: order,
    isLoading,
    isError,
  } = useQuery<Order>({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId!),
    enabled: !!orderId,
    staleTime: Infinity, // Confirmed orders don't change
    retry: 2,
  });

  /* ── Loading state ─────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando tu pedido...</p>
      </div>
    );
  }

  /* ── Error / cancelled state ───────────────────────────────────────── */
  if (isError || !orderId || paymentStatus === "cancelled") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
        <div className="rounded-full bg-destructive/10 p-6">
          <XCircle className="h-14 w-14 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Pago no completado
          </h1>
          <p className="text-muted-foreground max-w-md">
            {paymentStatus === "cancelled"
              ? "Cancelaste el proceso de pago. Tu pedido no ha sido confirmado y no se realizó ningún cobro."
              : "No pudimos verificar tu pago. Si realizaste el pago, comunícate con soporte."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="outline">
            <Link href="/cart">Volver al carrito</Link>
          </Button>
          <Button asChild>
            <Link href="/marketplace">Ver marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ── Success state ─────────────────────────────────────────────────── */
  return (
    <main className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 max-w-2xl">
      {/* ── Hero success header ──────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center gap-4 mb-10">
        {/* Animated checkmark ring */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative rounded-full bg-emerald-500/15 p-5">
            <CheckCircle2
              className="h-14 w-14 text-emerald-500"
              strokeWidth={1.5}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            ¡Pago confirmado!
          </h1>
          <p className="text-muted-foreground">
            Tu pedido ha sido recibido y será procesado pronto.
          </p>
        </div>

        {/* Order number badge */}
        {order && (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <Package className="h-4 w-4" />
            Pedido #{order.orderNumber}
          </div>
        )}
      </div>

      {/* ── Order detail card ────────────────────────────────────────── */}
      {order && (
        <div className="space-y-4">
          {/* Items */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                <ShoppingBag className="h-4 w-4" />
                Productos
              </div>
              <Separator />
              <div className="space-y-3">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Leaf className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cantidad: {item.quantity} ×{" "}
                          {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold shrink-0">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Detalles del pedido no disponibles.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping address */}
          {order.shippingAddress && (
            <Card>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  <MapPin className="h-4 w-4" />
                  Dirección de envío
                </div>
                <Separator />
                <address className="text-sm not-italic space-y-0.5 text-muted-foreground">
                  <p>{order.shippingAddress.streetLine1}</p>
                  {order.shippingAddress.streetLine2 && (
                    <p>{order.shippingAddress.streetLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city},{" "}
                    {order.shippingAddress.department}
                    {order.shippingAddress.postalCode &&
                      ` ${order.shippingAddress.postalCode}`}
                  </p>
                </address>
              </CardContent>
            </Card>
          )}

          {/* Totals */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotalAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Descuento</span>
                    <span>− {formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                {order.shippingAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Envío</span>
                    <span>{formatCurrency(order.shippingAmount)}</span>
                  </div>
                )}
                {order.shippingAmount === 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Envío</span>
                    <span>Gratis</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total pagado</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status info */}
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3 text-sm text-muted-foreground text-center">
            Recibirás un correo de confirmación con los detalles de tu pedido y
            la información de seguimiento cuando sea despachado.
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/marketplace">
                Seguir comprando
              </Link>
            </Button>
            <Button asChild className="flex-1 gap-2">
              <Link href="/orders">
                Ver mis pedidos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
