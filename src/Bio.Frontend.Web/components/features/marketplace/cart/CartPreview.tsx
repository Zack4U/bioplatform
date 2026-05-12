/**
 * CartPreview — slide-out cart panel with premium design.
 *
 * Uses Shadcn Sheet for a right-side slide-out.
 * Shows cart items with quantity controls, subtotal summary,
 * and checkout/continue shopping CTAs.
 *
 * Hydration-safe: waits for client mount before reading cart state.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useHydration } from "@/hooks/useHydration";
import { useCartPriceRefresh } from "@/hooks/features/marketplace/useCartPriceRefresh";
import { FavoritesCarousel } from "@/components/features/marketplace/cart/FavoritesCarousel";
import { formatCurrency } from "@/lib/constants";
import { useCartStore } from "@/store/cart-store";
import type { CartItem } from "@/types/marketplace";
import { Leaf, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";

/* ─── Inline Cart Item (scoped to this panel) ───────────────────────────── */

function PreviewItem({ item }: { item: CartItem }) {
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const removeItem = useCartStore((s) => s.removeItem);

    const hasDiscount = item.originalPrice && item.originalPrice > item.price;

    return (
        <div className="flex gap-3 py-3">
            {/* Thumbnail */}
            <Link
                href={`/marketplace/${item.slug}`}
                className="shrink-0 rounded-lg overflow-hidden bg-muted"
            >
                <div className="relative h-16 w-16">
                    {item.thumbnailUrl ? (
                        <Image
                            src={item.thumbnailUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Leaf
                                className="h-5 w-5 text-muted-foreground/40"
                                aria-hidden="true"
                            />
                        </div>
                    )}
                </div>
            </Link>

            {/* Info */}
            <div className="flex flex-1 flex-col min-w-0 justify-between">
                <div>
                    <Link
                        href={`/marketplace/${item.slug}`}
                        className="text-sm font-medium line-clamp-1 hover:text-primary transition-colors"
                    >
                        {item.name}
                    </Link>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xs font-semibold text-primary">
                            {formatCurrency(item.price)}
                        </span>
                        {hasDiscount && (
                            <span className="text-[11px] text-muted-foreground line-through">
                                {formatCurrency(item.originalPrice!)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Quantity + remove row */}
                <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center rounded-md border bg-muted/40">
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                                updateQuantity(
                                    item.productId,
                                    item.quantity - 1,
                                )
                            }
                            disabled={item.quantity <= 1}
                            aria-label="Disminuir cantidad"
                            className="h-6 w-6"
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="min-w-6 text-center text-xs font-semibold tabular-nums">
                            {item.quantity}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                                updateQuantity(
                                    item.productId,
                                    item.quantity + 1,
                                )
                            }
                            disabled={item.quantity >= item.maxStock}
                            aria-label="Aumentar cantidad"
                            className="h-6 w-6"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Eliminar ${item.name} del carrito`}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Line total */}
            <div className="shrink-0 text-right self-center">
                <span className="text-sm font-bold">
                    {formatCurrency(item.price * item.quantity)}
                </span>
            </div>
        </div>
    );
}

/* ─── CartPreview Component ─────────────────────────────────────────────── */

export function CartPreview() {
    const isHydrated = useHydration();
    const items = useCartStore((s) => s.items);
    const isOpen = useCartStore((s) => s.isOpen);
    const closeCart = useCartStore((s) => s.closeCart);
    const clearCart = useCartStore((s) => s.clearCart);
    const countValue = useCartStore((s) =>
        s.items.reduce((sum, item) => sum + item.quantity, 0),
    );
    const totalValue = useCartStore((s) =>
        s.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    );

    const count = isHydrated ? countValue : 0;
    const total = isHydrated ? totalValue : 0;

    // Validate prices every time the panel opens (throttled 60s)
    const { isRefreshing } = useCartPriceRefresh(isOpen && isHydrated);

    const handleClearCart = useCallback(() => {
        clearCart();
        closeCart();
    }, [clearCart, closeCart]);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
            <SheetContent
                side="right"
                className="flex w-full flex-col sm:max-w-md p-0"
            >
                {/* ── Header ────────────────────────────────────────────── */}
                <SheetHeader className="px-6 pt-6 pb-0">
                    <SheetTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            Carrito
                        </span>
                        <span className="flex items-center gap-2">
                            {isRefreshing && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Actualizando precios
                                </span>
                            )}
                            {count > 0 && (
                                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {count} {count === 1 ? "articulo" : "articulos"}
                                </span>
                            )}
                        </span>
                    </SheetTitle>

                    <SheetDescription className="sr-only">
                        {count > 0
                            ? "Revisa tus productos antes de continuar"
                            : "Tu carrito esta vacio"}
                    </SheetDescription>
                </SheetHeader>

                <Separator className="mt-4" />

                {count === 0 ? (
                    /* ── Empty state ────────────────────────────────────── */
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 px-6">
                        <div className="rounded-full bg-muted p-6">
                            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium">
                                Tu carrito esta vacio
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Explora el marketplace y agrega productos
                            </p>
                        </div>
                        <Button variant="outline" asChild onClick={closeCart}>
                            <Link href="/marketplace">Ver productos</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* ── Item list ────────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto px-6">
                            <div className="divide-y">
                                {items.map((item) => (
                                    <PreviewItem
                                        key={item.productId}
                                        item={item}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* ── Summary + Actions ────────────────────────── */}
                        <div className="border-t bg-muted/30 px-6 py-4 space-y-3">
                            {/* Summary rows */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Subtotal
                                    </span>
                                    <span className="font-medium">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Envio calculado en el checkout. Precios
                                    incluyen IVA.
                                </p>
                            </div>

                            <Separator />

                            {/* Total */}
                            <div className="flex items-center justify-between">
                                <span className="text-base font-semibold">
                                    Total estimado
                                </span>
                                <span className="text-xl font-bold text-primary">
                                    {formatCurrency(total)}
                                </span>
                            </div>

                            {/* CTA buttons */}
                            <div className="flex flex-col gap-2 pt-1">
                                <Button
                                    asChild
                                    size="lg"
                                    className="w-full"
                                    onClick={closeCart}
                                >
                                    <Link href="/cart">Ir al checkout</Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    asChild
                                    className="w-full"
                                    onClick={closeCart}
                                >
                                    <Link href="/marketplace">
                                        Seguir comprando
                                    </Link>
                                </Button>
                            </div>

                            {/* Clear cart */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-muted-foreground hover:text-destructive"
                                onClick={handleClearCart}
                            >
                                <Trash2 className="mr-1.5 h-3 w-3" />
                                Vaciar carrito
                            </Button>
                        </div>

                        {/* ── Favorites carousel ────────────────────────── */}
                        <FavoritesCarousel />
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

