/**
 * MyReviewsList — shows the user's submitted reviews in the profile tab.
 * Each review card links back to the product it was written for.
 *
 * @module components/features/profile/MyReviewsList
 */

"use client";

import { LoadingSpinner, Pagination } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyReviews } from "@/hooks/features/marketplace";
import { formatDate } from "@/lib/formatters";
import { MessageSquare, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`h-4 w-4 ${
                        i < rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted"
                    }`}
                />
            ))}
        </div>
    );
}

export function MyReviewsList() {
    const { reviews, isLoading, isError, totalPages, page, setPage } =
        useMyReviews(8);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (isError) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                Error al cargar tus reseñas. Intenta de nuevo.
            </p>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 py-16">
                <div className="rounded-full bg-muted p-6">
                    <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <h3 className="font-semibold">Sin reseñas todavia</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Despues de realizar una compra podras dejar reseñas de los
                        productos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Mis Reseñas</h2>
                <p className="text-sm text-muted-foreground">
                    Reseñas que has publicado en el marketplace
                </p>
            </div>

            <div className="space-y-4">
                {reviews.map((review) => (
                    <Card key={review.reviewId} className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                                {review.productThumbnailUrl && (
                                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                                        <Image
                                            src={review.productThumbnailUrl}
                                            alt={review.productName}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm font-medium">
                                        <Link
                                            href={`/marketplace/${review.productSlug}`}
                                            className="hover:text-primary transition-colors truncate block"
                                        >
                                            {review.productName}
                                        </Link>
                                    </CardTitle>
                                    <div className="mt-1 flex items-center gap-3">
                                        <StarRating rating={review.rating} />
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(review.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        {(review.title ?? review.comment) && (
                            <CardContent className="pt-0">
                                {review.title && (
                                    <p className="font-medium text-sm">{review.title}</p>
                                )}
                                {review.comment && (
                                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                        {review.comment}
                                    </p>
                                )}
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}
