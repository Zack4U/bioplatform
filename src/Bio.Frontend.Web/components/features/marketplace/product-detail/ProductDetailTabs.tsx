/**
 * ProductDetailTabs — tabbed detail sections for a product.
 *
 * Tabs: Descripción, Certificaciones & Trazabilidad, Reseñas.
 * Uses Shadcn Tabs primitive.
 *
 * - Description tab uses HtmlViewer for rich HTML content.
 * - Reviews tab shows a "Escribir reseña" button for authenticated users.
 *
 * UI ONLY — no data fetching, no side effects.
 */

"use client";

import { HtmlViewer } from "@/components/common/HtmlViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ProductDetailDTO } from "@/types/marketplace";
import {
  Award,
  Calendar,
  CheckCircle,
  FileText,
  Link2,
  MapPin,
  PenLine,
  ShieldCheck,
  Star,
} from "lucide-react";

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface ProductDetailTabsProps {
  product: ProductDetailDTO;
  /** Called when the authenticated user clicks "Escribir reseña". */
  onOpenReviewForm?: () => void;
  /** When true, shows the "Escribir reseña" button in the reviews tab. */
  isAuthenticated?: boolean;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function ProductDetailTabs({
  product,
  onOpenReviewForm,
  isAuthenticated = false,
}: ProductDetailTabsProps) {
  return (
    <section className="container mx-auto px-4 pb-8 sm:px-6 lg:px-8">
      <Tabs defaultValue="descripcion" className="w-full">
        <TabsList className="mb-6 w-full justify-start overflow-x-auto">
          <TabsTrigger value="descripcion" className="gap-1.5">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Descripcion
          </TabsTrigger>
          <TabsTrigger value="certificaciones" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Certificaciones
          </TabsTrigger>
          <TabsTrigger value="resenas" className="gap-1.5">
            <Star className="h-4 w-4" aria-hidden="true" />
            Resenas ({product.reviewCount})
          </TabsTrigger>
        </TabsList>

        {/* ── Description ──────────────────────────────────────── */}
        <TabsContent value="descripcion">
          <Card>
            <CardContent className="pt-6">
              {/* Rich HTML description from backend (sanitized) */}
              <HtmlViewer
                html={product.description}
                className="max-w-none"
                showEmpty
              />

              {/* Product metadata */}
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
                      Categoria:
                    </span>
                    <Badge variant="secondary">{product.categoryName}</Badge>
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
                  <Award className="h-5 w-5 text-primary" aria-hidden="true" />
                  Certificaciones
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.certifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Este producto no tiene certificaciones registradas.
                  </p>
                ) : (
                  product.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <CheckCircle
                        className="h-5 w-5 text-green-500 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{cert.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Emitido por: {cert.issuingBody}
                        </p>
                        {cert.expiresAt && (
                          <p className="text-xs text-muted-foreground">
                            Valido hasta:{" "}
                            {new Date(cert.expiresAt).toLocaleDateString(
                              "es-CO",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>
                        )}
                        {cert.verificationCode && (
                          <div className="mt-1 flex items-center gap-1">
                            <Link2
                              className="h-3 w-3 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <code className="text-[11px] bg-muted px-1 py-0.5 rounded">
                              {cert.verificationCode}
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
                  <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                  Trazabilidad
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.traceability.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin informacion de trazabilidad disponible.
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
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {new Date(batch.harvestDate).toLocaleDateString(
                            "es-CO",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        {batch.originLocation}
                      </p>
                      {batch.processingDetails && (
                        <p className="text-xs text-foreground">
                          {batch.processingDetails}
                        </p>
                      )}
                      {batch.blockchainHash && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShieldCheck
                            className="h-3 w-3 shrink-0"
                            aria-hidden="true"
                          />
                          <span>Blockchain: </span>
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
              {/* Summary + write review button */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {product.averageRating != null && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Score */}
                    <div className="text-center shrink-0">
                      <p className="text-4xl font-bold">
                        {product.averageRating.toFixed(1)}
                      </p>
                      <div className="flex items-center gap-0.5 mt-1 justify-center">
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.reviewCount}{" "}
                        {product.reviewCount === 1 ? "resena" : "resenas"}
                      </p>
                    </div>

                    {/* Rating distribution bars */}
                    <div className="flex-1 space-y-1.5 w-full max-w-xs">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = product.reviews.filter(
                          (r) => Math.round(r.rating) === stars,
                        ).length;
                        const percent =
                          product.reviews.length > 0
                            ? (count / product.reviews.length) * 100
                            : 0;
                        return (
                          <div
                            key={stars}
                            className="flex items-center gap-2"
                            aria-label={`${stars} estrellas: ${count} resenas`}
                          >
                            <span className="w-3 text-xs text-muted-foreground text-right">
                              {stars}
                            </span>
                            <Star
                              className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0"
                              aria-hidden="true"
                            />
                            <Progress
                              value={percent}
                              className="h-2 flex-1"
                              aria-hidden="true"
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

                {/* Write review button (authenticated only) */}
                {isAuthenticated && onOpenReviewForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenReviewForm}
                    className="gap-2 shrink-0 self-start"
                    aria-label="Escribir una resena para este producto"
                  >
                    <PenLine className="h-4 w-4" aria-hidden="true" />
                    Escribir resena
                  </Button>
                )}
              </div>

              <Separator />

              {/* Review list */}
              {product.reviews.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Aun no hay resenas para este producto.
                  </p>
                  {isAuthenticated && onOpenReviewForm && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onOpenReviewForm}
                      className="gap-2"
                    >
                      <PenLine className="h-4 w-4" aria-hidden="true" />
                      Ser el primero en opinar
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4" aria-label="Lista de resenas">
                  {product.reviews.map((review) => {
                    /* Compute initials from userName (up to 2 chars) */
                    const initials = review.userName
                      .split(" ")
                      .slice(0, 2)
                      .map((w: string) => w.charAt(0).toUpperCase())
                      .join("");

                    return (
                      <article
                        key={review.id}
                        className="rounded-lg border p-4"
                        aria-label={`Resena de ${review.userName}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar initials */}
                            <div
                              className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0"
                              aria-hidden="true"
                            >
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold leading-tight">
                                {review.userName}
                              </p>
                              <time
                                dateTime={review.createdAt}
                                className="text-xs text-muted-foreground"
                              >
                                {new Date(review.createdAt).toLocaleDateString(
                                  "es-CO",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </time>
                            </div>
                          </div>

                          {/* Star rating */}
                          <div
                            className="flex items-center gap-0.5"
                            aria-label={`Calificacion: ${review.rating} de 5 estrellas`}
                          >
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  i < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-muted text-muted",
                                )}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                        </div>

                        {review.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
