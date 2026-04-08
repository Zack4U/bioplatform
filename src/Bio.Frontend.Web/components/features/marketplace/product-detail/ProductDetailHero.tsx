/**
 * ProductDetailHero — image carousel + product info section.
 *
 * Two-column layout:
 *   Left: Image carousel (Shadcn Carousel)
 *   Right: Name, price, stock, rating, add-to-cart, entrepreneur link
 *
 * UI ONLY — consumes ProductDetailDTO directly.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useHydration } from "@/hooks/useHydration";
import type { ProductDetailDTO } from "@/types/marketplace";
import {
    CheckCircle,
    Leaf,
    Minus,
    Package,
    Plus,
    ShoppingCart,
    Star,
    Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface ProductDetailHeroProps {
    product: ProductDetailDTO;
}

export function ProductDetailHero({ product }: ProductDetailHeroProps) {
    const addItem = useCartStore((s) => s.addItem);
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const removeItem = useCartStore((s) => s.removeItem);
    const items = useCartStore((s) => s.items);
    const isHydrated = useHydration();
    const [quantity, setQuantity] = useState(1);

    const cartItem = isHydrated
        ? items.find((i) => i.productId === product.id)
        : undefined;
    const isInCart = !!cartItem;

    const handleAddToCart = useCallback(() => {
        addItem({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice ?? undefined,
            quantity,
            thumbnailUrl:
                product.images.find((i) => i.isPrimary)?.imageUrl ?? null,
            sku: product.sku,
            maxStock: product.stockQuantity,
        });
        toast.success(`${product.name} agregado al carrito`, {
            description: `Cantidad: ${quantity}`,
        });
    }, [addItem, product, quantity]);

    const hasDiscount =
        product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount
        ? Math.round(
              ((product.originalPrice! - product.price) /
                  product.originalPrice!) *
                  100,
          )
        : 0;

    return (
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
                {/* ── Image Carousel ─────────────────────────────────── */}
                <div className="relative">
                    <Carousel className="w-full">
                        <CarouselContent>
                            {product.images.map((img) => (
                                <CarouselItem key={img.id}>
                                    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                                        <Image
                                            src={img.imageUrl}
                                            alt={img.altText ?? product.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                            priority={img.isPrimary}
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {product.images.length > 1 && (
                            <>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                            </>
                        )}
                    </Carousel>

                    {/* Thumbnail strip */}
                    {product.images.length > 1 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                            {product.images.map((img) => (
                                <div
                                    key={img.id}
                                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 border-transparent hover:border-primary transition-colors cursor-pointer"
                                >
                                    <Image
                                        src={img.imageUrl}
                                        alt={
                                            img.altText ??
                                            `Miniatura de ${product.name}`
                                        }
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Product Info ────────────────────────────────────── */}
                <div className="flex flex-col gap-4">
                    {/* Category & certifications */}
                    <div className="flex flex-wrap items-center gap-2">
                        {product.categoryName && (
                            <Badge variant="secondary">
                                {product.categoryName}
                            </Badge>
                        )}
                        {product.certifications.map((cert) => (
                            <Badge
                                key={cert.certId}
                                variant="outline"
                                className="gap-1 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs"
                            >
                                <CheckCircle className="h-3 w-3" />
                                {cert.certName}
                            </Badge>
                        ))}
                    </div>

                    {/* Name */}
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        {product.name}
                    </h1>

                    {/* Entrepreneur */}
                    <p className="text-sm text-muted-foreground">
                        Vendido por{" "}
                        <span className="font-medium text-foreground">
                            {product.entrepreneurName}
                        </span>
                    </p>

                    {/* Rating */}
                    {product.rating !== null && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "h-4 w-4",
                                            i < Math.round(product.rating ?? 0)
                                                ? "fill-amber-400 text-amber-400"
                                                : "fill-muted text-muted",
                                        )}
                                        aria-hidden="true"
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {product.rating?.toFixed(1)} (
                                {product.reviewCount}{" "}
                                {product.reviewCount === 1
                                    ? "reseña"
                                    : "reseñas"}
                                )
                            </span>
                        </div>
                    )}

                    <Separator />

                    {/* Price */}
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-primary">
                            {formatCurrency(product.price)}
                        </span>
                        {hasDiscount && (
                            <>
                                <span className="text-lg text-muted-foreground line-through">
                                    {formatCurrency(product.originalPrice!)}
                                </span>
                                <Badge className="bg-red-500 text-white hover:bg-red-500">
                                    -{discountPercent}%
                                </Badge>
                            </>
                        )}
                    </div>

                    {/* Stock */}
                    <div className="flex items-center gap-2 text-sm">
                        <Package
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                        />
                        {product.stockQuantity > 0 ? (
                            <span
                                className={cn(
                                    product.stockQuantity <= 5
                                        ? "text-amber-600 dark:text-amber-400 font-medium"
                                        : "text-green-600 dark:text-green-400",
                                )}
                            >
                                {product.stockQuantity <= 5
                                    ? `¡Solo quedan ${product.stockQuantity}!`
                                    : `${product.stockQuantity} disponibles`}
                            </span>
                        ) : (
                            <span className="text-red-500 font-medium">
                                Agotado
                            </span>
                        )}
                    </div>

                    {/* Shipping hint */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Truck className="h-4 w-4" aria-hidden="true" />
                        Envío gratis en compras mayores a $150.000
                    </div>

                    <Separator />

                    {/* Quantity + Add to cart */}
                    {isInCart && cartItem ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex items-center rounded-md border">
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => {
                                        if (cartItem.quantity <= 1) {
                                            removeItem(product.id);
                                            toast.info("Producto eliminado del carrito");
                                        } else {
                                            updateQuantity(product.id, cartItem.quantity - 1);
                                        }
                                    }}
                                    aria-label="Disminuir cantidad"
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="min-w-12 text-center text-sm font-medium">
                                    {cartItem.quantity}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() =>
                                        updateQuantity(product.id, cartItem.quantity + 1)
                                    }
                                    disabled={cartItem.quantity >= product.stockQuantity}
                                    aria-label="Aumentar cantidad"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                En tu carrito
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex items-center rounded-md border">
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() =>
                                        setQuantity((q) => Math.max(1, q - 1))
                                    }
                                    disabled={quantity <= 1}
                                    aria-label="Disminuir cantidad"
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="min-w-12 text-center text-sm font-medium">
                                    {quantity}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() =>
                                        setQuantity((q) =>
                                            Math.min(product.stockQuantity, q + 1),
                                        )
                                    }
                                    disabled={quantity >= product.stockQuantity}
                                    aria-label="Aumentar cantidad"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <Button
                                id="add-to-cart-detail"
                                className="flex-1 gap-2"
                                size="lg"
                                onClick={handleAddToCart}
                                disabled={product.stockQuantity === 0}
                            >
                                <ShoppingCart
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                />
                                Agregar al carrito
                            </Button>
                        </div>
                    )}

                    {/* Species link */}
                    {product.baseSpeciesName && product.baseSpeciesSlug && (
                        <div className="mt-2 rounded-lg border border-dashed p-3 bg-muted/30">
                            <div className="flex items-center gap-2 text-sm">
                                <Leaf
                                    className="h-4 w-4 text-primary shrink-0"
                                    aria-hidden="true"
                                />
                                <span className="text-muted-foreground">
                                    Especie base:{" "}
                                </span>
                                <Link
                                    href={`/catalog/${product.baseSpeciesSlug}`}
                                    className="font-medium text-primary hover:underline italic"
                                >
                                    {product.baseSpeciesName}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
