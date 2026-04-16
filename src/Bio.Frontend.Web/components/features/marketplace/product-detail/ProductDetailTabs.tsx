/**
 * ProductDetailTabs — tabbed detail sections for a product.
 *
 * Tabs: Descripción, Certificaciones & Trazabilidad, Reseñas.
 * Uses Shadcn Tabs primitive.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ProductDetailDTO } from "@/types/marketplace";
import {
    Award,
    Calendar,
    CheckCircle,
    FileText,
    Link2,
    MapPin,
    ShieldCheck,
    Star,
} from "lucide-react";

interface ProductDetailTabsProps {
    product: ProductDetailDTO;
}

export function ProductDetailTabs({ product }: ProductDetailTabsProps) {
    return (
        <section className="container mx-auto px-4 pb-8 sm:px-6 lg:px-8">
            <Tabs defaultValue="descripcion" className="w-full">
                <TabsList className="mb-6 w-full justify-start">
                    <TabsTrigger value="descripcion" className="gap-1.5">
                        <FileText className="h-4 w-4" />
                        Descripción
                    </TabsTrigger>
                    <TabsTrigger value="certificaciones" className="gap-1.5">
                        <ShieldCheck className="h-4 w-4" />
                        Certificaciones
                    </TabsTrigger>
                    <TabsTrigger value="resenas" className="gap-1.5">
                        <Star className="h-4 w-4" />
                        Reseñas ({product.reviewCount})
                    </TabsTrigger>
                </TabsList>

                {/* ── Description ──────────────────────────────────────── */}
                <TabsContent value="descripcion">
                    <Card>
                        <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-6">
                            {product.description
                                .split("\n\n")
                                .map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center gap-2 text-sm rounded-lg border p-3">
                                    <span className="font-medium text-muted-foreground">
                                        SKU:
                                    </span>
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                        {product.sku}
                                    </code>
                                </div>
                                {product.categoryName && (
                                    <div className="flex items-center gap-2 text-sm rounded-lg border p-3">
                                        <span className="font-medium text-muted-foreground">
                                            Categoría:
                                        </span>
                                        <Badge variant="secondary">
                                            {product.categoryName}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Certifications & Traceability ────────────────────── */}
                <TabsContent value="certificaciones">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Certifications */}
                        <Card>
                            <CardHeader className="pb-3">
                                <h3 className="flex items-center gap-2 font-semibold">
                                    <Award className="h-5 w-5 text-primary" />
                                    Certificaciones
                                </h3>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {product.certifications.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Este producto no tiene certificaciones
                                        registradas.
                                    </p>
                                ) : (
                                    product.certifications.map((cert) => (
                                        <div
                                            key={cert.certId}
                                            className="flex items-start gap-3 rounded-lg border p-3"
                                        >
                                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm">
                                                    {cert.certName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Emitido por: {cert.issuer}
                                                </p>
                                                {cert.validUntil && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Válido hasta:{" "}
                                                        {new Date(
                                                            cert.validUntil,
                                                        ).toLocaleDateString(
                                                            "es-CO",
                                                        )}
                                                    </p>
                                                )}
                                                {cert.verificationCode && (
                                                    <div className="mt-1 flex items-center gap-1">
                                                        <Link2 className="h-3 w-3 text-muted-foreground" />
                                                        <code className="text-[11px] bg-muted px-1 py-0.5 rounded">
                                                            {
                                                                cert.verificationCode
                                                            }
                                                        </code>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Traceability */}
                        <Card>
                            <CardHeader className="pb-3">
                                <h3 className="flex items-center gap-2 font-semibold">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Trazabilidad
                                </h3>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {product.traceability.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Sin información de trazabilidad
                                        disponible.
                                    </p>
                                ) : (
                                    product.traceability.map((batch) => (
                                        <div
                                            key={batch.id}
                                            className="rounded-lg border p-3 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <code className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
                                                    {batch.batchCode}
                                                </code>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(
                                                        batch.harvestDate,
                                                    ).toLocaleDateString(
                                                        "es-CO",
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                {batch.originLocation}
                                            </p>
                                            {batch.processingDetails && (
                                                <p className="text-xs">
                                                    {batch.processingDetails}
                                                </p>
                                            )}
                                            {batch.blockchainHash && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <ShieldCheck className="h-3 w-3 shrink-0" />
                                                    <span>
                                                        Blockchain:{" "}
                                                    </span>
                                                    <code className="truncate text-[11px]">
                                                        {batch.blockchainHash}
                                                    </code>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Reviews ──────────────────────────────────────────── */}
                <TabsContent value="resenas">
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            {/* Summary */}
                            {product.rating != null && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-4xl font-bold">
                                            {product.rating.toFixed(1)}
                                        </p>
                                        <div className="flex items-center gap-0.5 mt-1">
                                            {Array.from(
                                                { length: 5 },
                                                (_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={cn(
                                                            "h-4 w-4",
                                                            i <
                                                                Math.round(
                                                                    product.rating ??
                                                                        0,
                                                                )
                                                                ? "fill-amber-400 text-amber-400"
                                                                : "fill-muted text-muted",
                                                        )}
                                                    />
                                                ),
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {product.reviewCount} reseñas
                                        </p>
                                    </div>

                                    {/* Rating distribution */}
                                    <div className="flex-1 space-y-1.5 w-full max-w-xs">
                                        {[5, 4, 3, 2, 1].map((stars) => {
                                            const count =
                                                product.reviews.filter(
                                                    (r) =>
                                                        Math.round(
                                                            r.rating,
                                                        ) === stars,
                                                ).length;
                                            const percent =
                                                product.reviews.length > 0
                                                    ? (count /
                                                          product.reviews
                                                              .length) *
                                                      100
                                                    : 0;
                                            return (
                                                <div
                                                    key={stars}
                                                    className="flex items-center gap-2"
                                                >
                                                    <span className="w-3 text-xs text-muted-foreground text-right">
                                                        {stars}
                                                    </span>
                                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                                                    <Progress
                                                        value={percent}
                                                        className="h-2 flex-1"
                                                    />
                                                    <span className="w-6 text-xs text-muted-foreground text-right">
                                                        {count}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <Separator />

                            {/* Review list */}
                            {product.reviews.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    Aún no hay reseñas para este producto.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {product.reviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="rounded-lg border p-4"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                                        {review.userName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {review.userName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(
                                                                review.createdAt,
                                                            ).toLocaleDateString(
                                                                "es-CO",
                                                                {
                                                                    year: "numeric",
                                                                    month: "long",
                                                                    day: "numeric",
                                                                },
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    {Array.from(
                                                        { length: 5 },
                                                        (_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={cn(
                                                                    "h-3.5 w-3.5",
                                                                    i <
                                                                        review.rating
                                                                        ? "fill-amber-400 text-amber-400"
                                                                        : "fill-muted text-muted",
                                                                )}
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className="text-sm text-muted-foreground">
                                                    {review.comment}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </section>
    );
}
