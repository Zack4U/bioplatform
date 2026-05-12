/**
 * CartItemRow — single cart item row for checkout views.
 *
 * Shows image, name, unit price (with original if discounted),
 * quantity controls, line total, and remove button.
 *
 * Layout: thumbnail | name + price + qty | line-total + remove
 * Remove button aligned to bottom-right of its cell.
 */

"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { CartItem } from "@/types/marketplace";
import { Leaf, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";

interface CartItemRowProps {
    item: CartItem;
    compact?: boolean;
}

export function CartItemRow({ item, compact = false }: CartItemRowProps) {
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const removeItem = useCartStore((s) => s.removeItem);

    const handleIncrease = useCallback(
        () => updateQuantity(item.productId, item.quantity + 1),
        [updateQuantity, item.productId, item.quantity],
    );

    const handleDecrease = useCallback(
        () => updateQuantity(item.productId, item.quantity - 1),
        [updateQuantity, item.productId, item.quantity],
    );

    const handleRemove = useCallback(
        () => removeItem(item.productId),
        [removeItem, item.productId],
    );

    const hasDiscount =
        item.basePrice && item.basePrice > item.sellPrice;

    return (
        <div
            className={cn(
                "flex gap-3",
                compact ? "py-2" : "py-3",
            )}
        >
            {/* Image */}
            <Link
                href={`/marketplace/${item.slug}`}
                className="shrink-0 rounded-lg overflow-hidden bg-muted"
            >
                <div
                    className={cn(
                        "relative",
                        compact ? "h-14 w-14" : "h-18 w-18",
                    )}
                >
                    {item.thumbnailUrl ? (
                        <Image
                            src={item.thumbnailUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes={compact ? "56px" : "72px"}
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

            {/* Info + controls */}
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
                            {formatCurrency(item.sellPrice)}
                        </span>
                        {hasDiscount && (
                            <span className="text-[11px] text-muted-foreground line-through">
                                {formatCurrency(item.basePrice!)}
                            </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                            c/u
                        </span>
                    </div>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1 mt-1">
                    <div className="flex items-center rounded-md border bg-muted/40">
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={handleDecrease}
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
                            onClick={handleIncrease}
                            disabled={item.quantity >= item.maxStock}
                            aria-label="Aumentar cantidad"
                            className="h-6 w-6"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Line total + remove (right column, vertically spread) */}
            <div className="flex flex-col items-end justify-between shrink-0">
                <span className="text-sm font-bold">
                    {formatCurrency(item.sellPrice * item.quantity)}
                </span>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleRemove}
                    aria-label={`Eliminar ${item.name} del carrito`}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
