/**
 * FavoritesGrid — displays the user's favorited products in the profile tab.
 *
 * @module components/features/profile/FavoritesGrid
 */

"use client";

import { LoadingSpinner } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/features/marketplace";
import { formatCurrency } from "@/lib/constants";
import { Heart, Star, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function FavoritesGrid() {
    const { favorites, isLoading, toggleFavorite } = useFavorites();

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
                <div className="rounded-full bg-muted p-6">
                    <Heart className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <h3 className="font-semibold">Sin favoritos todavia</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Agrega productos a favoritos desde el catalogo para verlos aqui.
                    </p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/marketplace">Explorar marketplace</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Mis Favoritos</h2>
                    <p className="text-sm text-muted-foreground">
                        {favorites.length} producto{favorites.length !== 1 ? "s" : ""} guardado{favorites.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map((product) => (
                    <div
                        key={product.id}
                        className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md"
                    >
                        {/* Thumbnail */}
                        <div className="relative aspect-square overflow-hidden bg-muted">
                            {product.thumbnailUrl ? (
                                <Image
                                    src={product.thumbnailUrl}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <Heart className="h-8 w-8 text-muted-foreground/40" />
                                </div>
                            )}
                            {/* Remove favorite button */}
                            <button
                                onClick={() => toggleFavorite(product.id)}
                                className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-destructive hover:text-white"
                                aria-label="Quitar de favoritos"
                            >
                                <Heart className="h-4 w-4 fill-current text-destructive" />
                            </button>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                            <h3 className="truncate font-medium text-sm leading-tight">
                                {product.name}
                            </h3>
                            {product.categoryName && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {product.categoryName}
                                </p>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                                <span className="font-semibold text-primary">
                                    {formatCurrency(product.price)}
                                </span>
                                {(product.rating ?? 0) > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                        {product.rating?.toFixed(1)}
                                    </span>
                                )}
                            </div>
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="mt-3 w-full h-8 text-xs"
                            >
                                <Link href={`/marketplace/${product.slug}`}>
                                    <ExternalLink className="mr-1.5 h-3 w-3" />
                                    Ver producto
                                </Link>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
