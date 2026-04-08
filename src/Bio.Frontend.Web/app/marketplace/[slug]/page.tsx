/**
 * /marketplace/[slug] — Product Detail page.
 *
 * Full detail view for a single product:
 *   1. Hero — Image carousel + product info + add-to-cart
 *   2. Tabs — Description, Certifications & Traceability, Reviews
 *
 * Data fetched via useProductDetail hook (React Query → mock service).
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 */

"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";
import { PageHeader } from "@/components/common/PageHeader";
import {
    ProductDetailHero,
    ProductDetailTabs,
} from "@/components/features/marketplace/product-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductDetail } from "@/hooks/features/marketplace/useProductDetail";
import { use } from "react";

interface ProductDetailPageProps {
    params: Promise<{ slug: string }>;
}

/* ─── Skeleton ──────────────────────────────────────────────────────────── */

function ProductDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <div className="space-y-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-12 w-40" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
    );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
    const { slug } = use(params);
    const { product, isLoading, isError, error, refetch } =
        useProductDetail(slug);

    /* ── Loading */
    if (isLoading) {
        return <ProductDetailSkeleton />;
    }

    /* ── Error */
    if (isError || !product) {
        return (
            <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <ErrorFallback
                    title="Producto no encontrado"
                    message={
                        error instanceof Error
                            ? error.message
                            : "No se pudo cargar la información de este producto. Verifica la URL o intenta nuevamente."
                    }
                    onRetry={refetch}
                />
            </div>
        );
    }

    /* ── Detail view */
    return (
        <main className="min-h-screen">
            {/* Breadcrumbs */}
            <div className="container mx-auto px-4 pt-6 sm:px-6 lg:px-8">
                <PageHeader
                    title=""
                    breadcrumbs={[
                        { label: "Inicio", href: "/" },
                        { label: "Marketplace", href: "/marketplace" },
                        { label: product.name },
                    ]}
                />
            </div>

            {/* 1. Hero */}
            <ProductDetailHero product={product} />

            {/* 2. Tabs */}
            <ProductDetailTabs product={product} />
        </main>
    );
}
