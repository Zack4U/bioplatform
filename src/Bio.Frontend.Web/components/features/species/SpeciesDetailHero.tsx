/**
 * SpeciesDetailHero — full-width hero section for the species detail page.
 *
 * Displays the species thumbnail as a large banner with gradient overlay,
 * scientific name, common name, and status badges (conservation, sensitivity).
 * Responsive: full-width on all screens with aspect ratio control.
 *
 * UI ONLY — receives data via props (no data fetching).
 */

"use client";

import { SmartImage } from "@/components/common/SmartImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    formatConservationStatus,
    getConservationStatusColor,
} from "@/lib/formatters";
import type { SpeciesDetail } from "@/types/species";
import { ArrowLeft, Leaf, MapPin, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface SpeciesDetailHeroProps {
    species: SpeciesDetail;
}

export function SpeciesDetailHero({ species }: SpeciesDetailHeroProps) {
    return (
        <section
            className="relative w-full overflow-hidden bg-muted"
            aria-label="Información principal de la especie"
        >
            {/* ── Background Image ─────────────────────────────────────────── */}
            <div className="relative aspect-[21/9] min-h-[280px] max-h-[480px] w-full sm:aspect-[3/1]">
                {species.thumbnailUrl ? (
                    <SmartImage
                        src={species.thumbnailUrl}
                        alt={`Fotografía de ${species.commonName ?? species.scientificName}`}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Leaf className="h-24 w-24 text-primary/20" aria-hidden="true" />
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* ── Content overlay ──────────────────────────────────────── */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:p-8">
                    <div className="container mx-auto">
                        {/* Back button */}
                        <Link href="/catalog" className="mb-4 inline-block">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver al catálogo
                            </Button>
                        </Link>

                        {/* Names */}
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                            <span className="italic">{species.scientificName}</span>
                        </h1>
                        {species.commonName && (
                            <p className="mt-1 text-lg sm:text-xl text-white/80 font-medium">
                                {species.commonName}
                            </p>
                        )}

                        {/* Badges */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {species.conservationStatus && (
                                <Badge
                                    className={
                                        getConservationStatusColor(species.conservationStatus)
                                    }
                                >
                                    {formatConservationStatus(species.conservationStatus)}
                                </Badge>
                            )}

                            {species.isSensitive && (
                                <Badge variant="destructive" className="gap-1">
                                    <ShieldAlert className="h-3 w-3" />
                                    Especie Sensible
                                </Badge>
                            )}

                            {species.altitudeRange && (
                                <Badge
                                    variant="secondary"
                                    className="gap-1 bg-white/20 text-white border-white/30 hover:bg-white/30"
                                >
                                    <MapPin className="h-3 w-3" />
                                    {species.altitudeRange}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
