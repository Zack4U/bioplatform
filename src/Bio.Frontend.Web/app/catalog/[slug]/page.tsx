/**
 * /catalog/[slug] — Species Detail page.
 *
 * Full detail view for a single species with 5 sections:
 *   1. Hero — full-width image with gradient overlay, names, badges
 *   2. Info Card — taxonomy grid + status badges
 *   3. Detail Tabs — Description, Traditional Uses, Economic Potential, Ecological Info
 *   4. Distribution Map — Leaflet map centered on Caldas with distribution points
 *   5. Related Products — grid of products linked to this species
 *
 * Data fetched via useSpeciesDetail hook (React Query → GET /api/species/slug/{slug}).
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 */

"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";
import { RelatedProducts } from "@/components/features/species/RelatedProducts";
import { SpeciesDetailHero } from "@/components/features/species/SpeciesDetailHero";
import { SpeciesDetailSkeleton } from "@/components/features/species/SpeciesDetailSkeleton";
import { SpeciesDetailTabs } from "@/components/features/species/SpeciesDetailTabs";
import { SpeciesDistributionMap } from "@/components/features/species/SpeciesDistributionMap";
import { SpeciesInfoCard } from "@/components/features/species/SpeciesInfoCard";
import { useSpeciesDetail } from "@/hooks/features/catalog/useSpeciesDetail";
import { use } from "react";

interface SpeciesDetailPageProps {
    params: Promise<{ slug: string }>;
}

export default function SpeciesDetailPage({ params }: SpeciesDetailPageProps) {
    const { slug } = use(params);
    const { species, isLoading, isError, error, refetch } =
        useSpeciesDetail(slug);

    /* ── Loading state ─────────────────────────────────────────────── */
    if (isLoading) {
        return <SpeciesDetailSkeleton />;
    }

    /* ── Error state ───────────────────────────────────────────────── */
    if (isError || !species) {
        return (
            <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <ErrorFallback
                    title="Especie no encontrada"
                    message={
                        error instanceof Error
                            ? error.message
                            : "No se pudo cargar la información de esta especie. Verifica la URL o intenta nuevamente."
                    }
                    onRetry={refetch}
                />
            </div>
        );
    }

    /* ── Detail view ───────────────────────────────────────────────── */
    return (
        <main className="min-h-screen">
            {/* 1. Hero */}
            <SpeciesDetailHero species={species} />

            <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* 2. Taxonomy & Status Info */}
                <SpeciesInfoCard species={species} />

                {/* 3. Detail Tabs */}
                <SpeciesDetailTabs species={species} />

                {/* 4. Distribution Map */}
                <SpeciesDistributionMap
                    distributions={species.distributions}
                    isSensitive={species.isSensitive}
                    hasMaskedPoints={species.distributions.some((d) => d.isMasked)}
                />

                {/* 5. Related Products */}
                <RelatedProducts products={species.relatedProducts} />
            </div>
        </main>
    );
}
