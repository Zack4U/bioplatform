/**
 * CheckoutSummaryStep — Step 1: Product table with checkboxes, quantities, subtotals.
 *
 * Allows the user to select which cart items to include in the order.
 */

"use client";

import { CartItemRow } from "@/components/features/marketplace/cart/CartItemRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import type { CartItem } from "@/types/marketplace";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

interface CheckoutSummaryStepProps {
    items: CartItem[];
    selectedItems: CartItem[];
    onContinue: () => void;
    canContinue: boolean;
}

export function CheckoutSummaryStep({
    items,
    selectedItems,
    onContinue,
    canContinue,
}: CheckoutSummaryStepProps) {
    const toggleItemSelection = useCartStore((s) => s.toggleItemSelection);
    const selectAllItems = useCartStore((s) => s.selectAllItems);
    const deselectAllItems = useCartStore((s) => s.deselectAllItems);
    const isItemSelected = useCartStore((s) => s.isItemSelected);

    const allSelected = items.length > 0 && selectedItems.length === items.length;

    if (items.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
                    <div className="rounded-full bg-muted p-6">
                        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                        Tu carrito está vacío. Añade productos desde el
                        marketplace.
                    </p>
                    <Button variant="outline" asChild>
                        <Link href="/marketplace">Ir al marketplace</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        Productos en tu carrito
                    </h2>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="select-all"
                            checked={allSelected}
                            onCheckedChange={(checked) =>
                                checked
                                    ? selectAllItems()
                                    : deselectAllItems()
                            }
                        />
                        <label
                            htmlFor="select-all"
                            className="text-sm text-muted-foreground cursor-pointer"
                        >
                            Seleccionar todos
                        </label>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    Selecciona los productos que deseas incluir en tu pedido.
                </p>
            </CardHeader>
            <Separator />
            <CardContent className="pt-2">
                <div className="divide-y">
                    {items.map((item) => (
                        <div
                            key={item.productId}
                            className="flex items-center gap-3 py-2"
                        >
                            <Checkbox
                                id={`select-${item.productId}`}
                                checked={isItemSelected(item.productId)}
                                onCheckedChange={() =>
                                    toggleItemSelection(item.productId)
                                }
                            />
                            <div className="flex-1 min-w-0">
                                <CartItemRow item={item} compact />
                            </div>
                        </div>
                    ))}
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {selectedItems.length} de {items.length} producto
                        {items.length !== 1 ? "s" : ""} seleccionado
                        {selectedItems.length !== 1 ? "s" : ""}
                    </p>
                    <Button
                        onClick={onContinue}
                        disabled={!canContinue}
                        size="lg"
                    >
                        Continuar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
