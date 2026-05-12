/**
 * FavoritesCarousel — horizontal scroll carousel of the user's favorite products.
 * Displayed at the bottom of the CartPreview panel to encourage additional purchases.
 *
 * Only rendered when:
 *  - User is authenticated (useFavorites requires auth)
 *  - There are favorite products
 *
 * @module components/features/marketplace/cart/FavoritesCarousel
 */

"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import { useFavorites } from "@/hooks/features/marketplace";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency } from "@/lib/constants";
import { Heart, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface FavoriteCardMiniProps {
    id: string;
    slug: string;
    name: string;
    thumbnailUrl: string | null;
    price: number;
    rating: number;
    sku: string;
}

function FavoriteCardMini({
    id,
    slug,
    name,
    thumbnailUrl,
    price,
    rating,
    sku,
}: FavoriteCardMiniProps) {
    const addItem = useCartStore((s) => s.addItem);
    const items = useCartStore((s) => s.items);
    const alreadyInCart = items.some((i) => i.productId === id);

    function handleAdd() {
        if (alreadyInCart) return;
        addItem({
            productId: id,
            name,
            price: price,
            quantity: 1,
            maxStock: 99,
            thumbnailUrl: thumbnailUrl,
            slug,
            sku,
        });
    }

    return (
        <div className="flex-shrink-0 w-36 rounded-xl border bg-card overflow-hidden group transition-all hover:shadow-sm">
            <div className="relative h-24 w-full overflow-hidden bg-muted">
                {thumbnailUrl ? (
                    <Image
                        src={thumbnailUrl}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <Heart className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                )}
            </div>
            <div className="p-2 space-y-1">
                <p className="text-xs font-medium leading-tight line-clamp-2">{name}</p>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">
                        {formatCurrency(price)}
                    </span>
                    {rating > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            {rating.toFixed(1)}
                        </span>
                    )}
                </div>
                <Button
                    variant={alreadyInCart ? "secondary" : "outline"}
                    size="sm"
                    className="w-full h-6 text-[11px] mt-1"
                    onClick={handleAdd}
                    disabled={alreadyInCart}
                    asChild={!alreadyInCart ? undefined : undefined}
                >
                    <span>
                        {alreadyInCart ? (
                            "En carrito"
                        ) : (
                            <>
                                <ShoppingCart className="mr-1 h-2.5 w-2.5" />
                                Agregar
                            </>
                        )}
                    </span>
                </Button>
            </div>
        </div>
    );
}

export function FavoritesCarousel() {
    const { isAuthenticated } = useAuthStore();
    const { favorites, isLoading } = useFavorites();

    // Only render for authenticated users with favorites
    if (!isAuthenticated || isLoading || favorites.length === 0) return null;

    // Show max 8 items to keep it performant
    const displayFavorites = favorites.slice(0, 8);

    return (
        <div className="mt-auto border-t bg-muted/30">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Heart className="h-3 w-3 fill-current text-rose-500" />
                        Tus favoritos
                    </h3>
                    <Link
                        href="/profile?tab=favorites"
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Ver todos
                    </Link>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {displayFavorites.map((product) => (
                        <FavoriteCardMini
                            key={product.id}
                            id={product.id}
                            slug={product.slug}
                            name={product.name}
                            thumbnailUrl={product.thumbnailUrl}
                            price={product.price}
                            rating={product.rating ?? 0}
                            sku={product.sku}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
