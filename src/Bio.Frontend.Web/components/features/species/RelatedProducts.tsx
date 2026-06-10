/**
 * RelatedProducts — horizontal carousel of related products for species detail.
 *
 * Shows products linked to the species via BaseSpeciesId.
 * Uses Embla Carousel via ShadCN Carousel component.
 * Prepared to receive RelatedProduct[] from the backend.
 *
 * UI ONLY — receives data via props.
 */

"use client";

import { SmartImage } from "@/components/common/SmartImage";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { RelatedProduct } from "@/types/species";
import { Package, ShoppingBag } from "lucide-react";

interface RelatedProductsProps {
    products: RelatedProduct[];
}

/* ─── Price formatter ─────────────────────────────────────────────────── */

function formatPrice(price: number): string {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function RelatedProducts({ products }: RelatedProductsProps) {
    if (products.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                        Productos Relacionados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Package
                            className="mb-2 h-8 w-8 text-muted-foreground/40"
                            aria-hidden="true"
                        />
                        <p className="text-sm text-muted-foreground">
                            Aún no hay productos vinculados a esta especie.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                            Los emprendedores pueden registrar productos
                            derivados de esta especie en el Marketplace.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    Productos Relacionados
                    <Badge variant="secondary" className="ml-1 text-xs">
                        {products.length}
                    </Badge>
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => (
                        <Card
                            key={product.id}
                            className="flex flex-row overflow-hidden pt-0 transition-shadow hover:shadow-md"
                        >
                            {/* Image */}
                            <div className="relative h-24 w-24 shrink-0 bg-muted">
                                {product.thumbnailUrl ? (
                                    <SmartImage
                                        src={product.thumbnailUrl}
                                        alt={product.name}
                                        fill
                                        sizes="96px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Package
                                            className="h-6 w-6 text-muted-foreground/40"
                                            aria-hidden="true"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-1 flex-col justify-between p-3">
                                <CardHeader className="p-0">
                                    <h4 className="line-clamp-1 text-sm font-medium">
                                        {product.name}
                                    </h4>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                        {product.description}
                                    </p>
                                </CardHeader>

                                <CardFooter className="mt-1 flex items-center justify-between p-0">
                                    <span className="text-sm font-semibold text-primary">
                                        {formatPrice(product.sellPrice)}
                                    </span>
                                    <Badge
                                        variant={product.isActive ? "default" : "secondary"}
                                        className="text-[10px]"
                                    >
                                        {product.isActive ? "Disponible" : "No disponible"}
                                    </Badge>
                                </CardFooter>
                            </div>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
