/**
 * ProductDetailHero — image carousel + product info section.
 *
 * Two-column layout:
 *   Left: Image carousel (Shadcn Carousel)
 *   Right: Name, price, stock, rating, add-to-cart, entrepreneur link
 *
 * Supports favorite toggle via isFavorite / onToggleFavorite props.
 *
 * UI ONLY — consumes ProductDetailDTO directly, cart logic via Zustand.
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
import { useHydration } from "@/hooks/useHydration";
import { formatCurrency } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { ProductDetailDTO } from "@/types/marketplace";
import {
  CheckCircle,
  Heart,
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

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface ProductDetailHeroProps {
  product: ProductDetailDTO;
  /** Whether this product is in the current user's favorites. */
  isFavorite?: boolean;
  /** Called when the user clicks the heart/favorite button. */
  onToggleFavorite?: () => void;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function ProductDetailHero({
  product,
  isFavorite = false,
  onToggleFavorite,
}: ProductDetailHeroProps) {
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
      sellPrice: product.sellPrice,
        basePrice: product.basePrice,
      
      quantity,
      thumbnailUrl: product.images.find((i) => i.isPrimary)?.imageUrl ?? null,
      sku: product.sku,
      maxStock: product.stockQuantity,
    });
    toast.success(`${product.name} agregado al carrito`, {
      description: `Cantidad: ${quantity}`,
    });
  }, [addItem, product, quantity]);

  const hasDiscount =
    product.basePrice && product.basePrice > product.sellPrice;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.basePrice! - product.sellPrice) / product.basePrice!) *
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
                    alt={img.altText ?? `Miniatura de ${product.name}`}
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
              <Badge variant="secondary">{product.categoryName}</Badge>
            )}
            {product.certifications.map((cert) => (
              <Badge
                key={cert.id}
                variant="outline"
                className="gap-1 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs"
              >
                <CheckCircle className="h-3 w-3" aria-hidden="true" />
                {cert.name}
              </Badge>
            ))}
          </div>

          {/* Name + Favorite button */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {product.name}
            </h1>

            {/* Favorite toggle */}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={onToggleFavorite}
                aria-label={
                  isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                }
                aria-pressed={isFavorite}
                className={cn(
                  "mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background transition-colors",
                  "hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  isFavorite &&
                    "border-rose-300 bg-rose-50 dark:bg-rose-950/30",
                )}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isFavorite
                      ? "fill-rose-500 text-rose-500"
                      : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          {/* Entrepreneur */}
          <p className="text-sm text-muted-foreground">
            Vendido por{" "}
            <span className="font-medium text-foreground">
              {product.entrepreneurName}
            </span>
          </p>

          {/* Rating */}
          {product.averageRating !== null && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < Math.round(product.averageRating ?? 0)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-muted text-muted",
                    )}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.averageRating?.toFixed(1)} ({product.reviewCount}{" "}
                {product.reviewCount === 1 ? "resena" : "resenas"})
              </span>
            </div>
          )}

          <Separator />

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(product.sellPrice)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(product.basePrice!)}
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
                  ? `Solo quedan ${product.stockQuantity}!`
                  : `${product.stockQuantity} disponibles`}
              </span>
            ) : (
              <span className="text-red-500 font-medium">Agotado</span>
            )}
          </div>

          {/* Shipping hint */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" aria-hidden="true" />
            Envio gratis en compras mayores a $150.000
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
              <p className="text-sm text-muted-foreground">En tu carrito</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center rounded-md border">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
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
                    setQuantity((q) => Math.min(product.stockQuantity, q + 1))
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
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
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
                <span className="text-muted-foreground">Especie base: </span>
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
