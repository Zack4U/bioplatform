/**
 * ProductCard — feature card for the Marketplace.
 *
 * UI ONLY — displays a ProductListItem.
 * Built on Shadcn Card + Badge primitives.
 *
 * 3 clear sections:
 *   1. Image — fixed aspect ratio with discount/stock overlays + favorite button
 *   2. Details — name, entrepreneur, rating, badges, certifications
 *   3. Price + Action — price with discount, add-to-cart / quantity controls
 *
 * When the item is already in the cart, shows quantity controls instead of
 * the add-to-cart button.
 *
 * WCAG: meaningful alt text, focus-visible ring, semantic structure.
 * Supports both grid and list view layouts.
 */

"use client";

import { SmartImage } from "@/components/common/SmartImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ViewMode } from "@/hooks/features/marketplace/useProductCatalog";
import { useHydration } from "@/hooks/useHydration";
import { formatCurrency } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { ProductListItem } from "@/types/marketplace";
import { Heart, Leaf, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import { toast } from "sonner";

/* ─── Star rating display ───────────────────────────────────────────────── */

function StarRating({
  rating,
  reviewCount,
}: {
  rating: number | null;
  reviewCount: number;
}) {
  if (rating === null) return null;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted",
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)} ({reviewCount})
      </span>
    </div>
  );
}

/* ─── Quantity Controls (when item is in cart) ──────────────────────────── */

function QuantityControls({
  productId,
  quantity,
  maxStock,
}: {
  productId: string;
  quantity: number;
  maxStock: number;
}) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const handleDecrease = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (quantity <= 1) {
        removeItem(productId);
        toast.info("Producto eliminado del carrito");
      } else {
        updateQuantity(productId, quantity - 1);
      }
    },
    [updateQuantity, removeItem, productId, quantity],
  );

  const handleIncrease = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      updateQuantity(productId, quantity + 1);
    },
    [updateQuantity, productId, quantity],
  );

  return (
    <div className="flex items-center rounded-lg border bg-muted/50">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleDecrease}
        aria-label="Disminuir cantidad"
        className="h-8 w-8 rounded-r-none"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
        {quantity}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleIncrease}
        disabled={quantity >= maxStock}
        aria-label="Aumentar cantidad"
        className="h-8 w-8 rounded-l-none"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface ProductCardProps {
  product: ProductListItem;
  viewMode?: ViewMode;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
  className?: string;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function ProductCard({
  product,
  viewMode = "grid",
  isFavorite = false,
  onToggleFavorite,
  className,
}: ProductCardProps) {
  const isListView = viewMode === "list";
  const isHydrated = useHydration();
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);

  const cartItem = isHydrated
    ? items.find((i) => i.productId === product.id)
    : undefined;
  const isInCart = !!cartItem;

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        sellPrice: product.sellPrice,
        basePrice: product.basePrice,
        quantity: 1,
        thumbnailUrl: product.thumbnailUrl,
        sku: product.sku,
        maxStock: product.stockQuantity,
      });
      toast.success(`${product.name} agregado al carrito`);
    },
    [addItem, product],
  );

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onToggleFavorite?.(product.id);
    },
    [onToggleFavorite, product.id],
  );

  const hasDiscount =
    product.basePrice && product.basePrice > product.sellPrice;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.basePrice! - product.sellPrice) / product.basePrice!) * 100,
      )
    : 0;

  return (
    <Link
      href={`/marketplace/${product.slug}`}
      className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      aria-label={`Ver detalle de ${product.name}`}
    >
      <Card
        className={cn(
          "overflow-hidden pt-0 transition-all duration-200 hover:shadow-md hover:border-primary/30 group-focus-visible:border-primary/30",
          isListView ? "flex flex-row pb-0 h-40" : "flex flex-col h-full",
          className,
        )}
      >
        {/* ═══════════════════════════════════════════════════════
                    SECTION 1: IMAGE
                   ═══════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "relative overflow-hidden bg-muted shrink-0",
            isListView ? "h-full w-36 sm:w-40" : "aspect-4/3 w-full",
          )}
        >
          {product.thumbnailUrl ? (
            <SmartImage
              src={product.thumbnailUrl}
              alt={`Fotografia de ${product.name}`}
              fill
              sizes={
                isListView
                  ? "160px"
                  : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              }
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Leaf
                className="h-10 w-10 text-muted-foreground/40"
                aria-hidden="true"
              />
            </div>
          )}

          {/* Discount badge overlay */}
          {hasDiscount && (
            <div className="absolute left-2 top-2">
              <Badge className="gap-1 bg-red-500 text-white text-xs hover:bg-red-500 shadow-sm">
                -{discountPercent}%
              </Badge>
            </div>
          )}

          {/* Stock warning */}
          {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
            <div
              className={cn(
                "absolute top-2",
                hasDiscount ? "right-2" : "right-2",
              )}
            >
              <Badge
                variant="outline"
                className="bg-background/80 backdrop-blur text-xs border-amber-500/50 text-amber-600 dark:text-amber-400 shadow-sm"
              >
                Quedan {product.stockQuantity}
              </Badge>
            </div>
          )}

          {/* Favorite button — top-right corner */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={
                isFavorite
                  ? `Quitar ${product.name} de favoritos`
                  : `Agregar ${product.name} a favoritos`
              }
              aria-pressed={isFavorite}
              className={cn(
                "absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur shadow-sm transition-colors",
                "hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                // Push down when stock badge is visible
                product.stockQuantity <= 5 && product.stockQuantity > 0
                  ? "top-10"
                  : "top-2",
              )}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  isFavorite
                    ? "fill-rose-500 text-rose-500"
                    : "text-muted-foreground",
                )}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
                    SECTION 2: DETAILS (fills remaining space)
                   ═══════════════════════════════════════════════════════ */}
        <div className="flex flex-1 flex-col min-w-0">
          <CardHeader className="gap-1 pb-1.5">
            <h3
              className="line-clamp-2 text-sm font-semibold leading-tight group-hover:text-primary transition-colors"
              title={product.name}
            >
              {product.name}
            </h3>
            {product.entrepreneurName && (
              <p
                className="line-clamp-1 text-xs text-muted-foreground"
                title={product.entrepreneurName}
              >
                {product.entrepreneurName}
              </p>
            )}
          </CardHeader>

          <CardContent className="pb-0 pt-0 space-y-1.5 flex-1">
            {/* Rating */}
            <StarRating
              rating={product.averageRating}
              reviewCount={product.reviewCount}
            />

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1">
              {product.categoryName && (
                <Badge variant="secondary" className="text-[11px] font-normal">
                  {product.categoryName}
                </Badge>
              )}
              {product.baseSpeciesName && (
                <Badge
                  variant="outline"
                  className="text-[11px] font-normal italic"
                >
                  {product.baseSpeciesName}
                </Badge>
              )}
            </div>

                        {/* Certifications */}
                        {(product.certifications?.length ?? 0) > 0 && !isListView && (
                            <div className="flex flex-wrap items-center gap-1">
                                {product.certifications
                                    .slice(0, 2)
                                    .map((cert) => (
                                        <TooltipProvider key={cert}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] font-normal bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                                                    >
                                                        {cert}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Certificacion: {cert}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                            </div>
                        )}
                    </CardContent>

          {/* ═══════════════════════════════════════════════════
                        SECTION 3: PRICE + ACTION (always at bottom)
                       ═══════════════════════════════════════════════════ */}

          <CardFooter className="pt-2.5 pb-0 flex items-center justify-between gap-2">
            {/* Price block */}
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary leading-tight">
                {formatCurrency(product.sellPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs font-medium text-muted-foreground line-through">
                  {formatCurrency(product.basePrice!)}
                </span>
              )}
            </div>

            {/* Action: quantity controls if in cart, add button otherwise */}
            {isInCart && cartItem ? (
              <QuantityControls
                productId={product.id}
                quantity={cartItem.quantity}
                maxStock={product.stockQuantity}
              />
            ) : (
              <Button
                id={`add-to-cart-${product.id}`}
                size="sm"
                onClick={handleAddToCart}
                aria-label={`Agregar ${product.name} al carrito`}
                className="gap-1.5 shrink-0"
                disabled={product.stockQuantity === 0}
              >
                <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Agregar</span>
              </Button>
            )}
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────────────── */

export function ProductCardSkeleton({
  viewMode = "grid",
}: {
  viewMode?: ViewMode;
}) {
  const isListView = viewMode === "list";

  return (
    <Card
      className={cn(
        "overflow-hidden pt-0",
        isListView ? "flex flex-row pb-0 h-40" : "flex flex-col",
      )}
    >
      <Skeleton
        className={cn(
          "shrink-0",
          isListView ? "h-full w-36 sm:w-40" : "aspect-4/3 w-full",
        )}
      />
      <div className="flex flex-1 flex-col p-4 gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1.5 mt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between items-center mt-auto">
          <div className="space-y-1">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
    </Card>
  );
}
