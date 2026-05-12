/**
 * RelatedProductsGrid — horizontal scrollable grid of related products.
 * Rendered at the bottom of the product detail page.
 *
 * @module components/features/marketplace/product-detail/RelatedProductsGrid
 */

"use client";

import { useRelatedProducts } from "@/hooks/features/marketplace";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/constants";
import { ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RelatedProductsGridProps {
    productId: string;
}

export function RelatedProductsGrid({ productId }: RelatedProductsGridProps) {
    const { data: related = [], isLoading } = useRelatedProducts(productId, 6);
    const addItem = useCartStore((s) => s.addItem);
    const cartItems = useCartStore((s) => s.items);

    if (isLoading) {
        return (
            <div className="mt-12">
                <h2 className="mb-4 text-xl font-bold">Productos relacionados</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-52 animate-pulse rounded-xl bg-muted"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (related.length === 0) return null;

    return (
        <section aria-labelledby="related-products-heading" className="mt-12">
            <h2
                id="related-products-heading"
                className="mb-4 text-xl font-bold tracking-tight"
            >
                Productos relacionados
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {related.map((product) => {
                    const inCart = cartItems.some(
                        (i) => i.productId === product.id,
                    );
                    return (
                        <div
                            key={product.id}
                            className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md"
                        >
                            {/* Thumbnail */}
                            <Link
                                href={`/marketplace/${product.slug}`}
                                className="relative aspect-square overflow-hidden bg-muted block"
                            >
                                {product.thumbnailUrl ? (
                                    <Image
                                        src={product.thumbnailUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <ShoppingCart className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                )}
                            </Link>

                            {/* Info */}
                            <div className="flex flex-1 flex-col p-3">
                                <Link
                                    href={`/marketplace/${product.slug}`}
                                    className="flex-1"
                                >
                                    <p className="line-clamp-2 text-xs font-medium leading-tight hover:text-primary transition-colors">
                                        {product.name}
                                    </p>
                                </Link>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-primary">
                                        {formatCurrency(product.price)}
                                    </span>
                                    {(product.rating ?? 0) > 0 && (
                                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                            {product.rating?.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant={inCart ? "secondary" : "outline"}
                                    size="sm"
                                    className="mt-2 h-7 w-full text-[11px]"
                                    disabled={
                                        inCart || product.stockQuantity === 0
                                    }
                                    onClick={() => {
                                        if (inCart) return;
                                        addItem({
                                            productId: product.id,
                                            name: product.name,
                                            price: product.price,
                                            quantity: 1,
                                            maxStock: product.stockQuantity,
                                            thumbnailUrl: product.thumbnailUrl,
                                            slug: product.slug,
                                            sku: product.sku,
                                        });
                                    }}
                                >
                                    {product.stockQuantity === 0
                                        ? "Sin stock"
                                        : inCart
                                          ? "En carrito"
                                          : "Agregar"}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
