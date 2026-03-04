/**
 * SpeciesCard — feature card for the Species Catalog.
 *
 * UI ONLY — displays a SpeciesListItem.
 * Built on Shadcn Card + Badge primitives.
 * WCAG: meaningful alt text, focus-visible ring, semantic structure.
 *
 * Supports both grid and list view layouts.
 */

"use client";

import { SmartImage } from "@/components/common/SmartImage";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Eye, Leaf, ShieldAlert } from "lucide-react";
import Link from "next/link";

import type { ViewMode } from "@/hooks/features/catalog/useSpeciesCatalog";
import type { SpeciesListItem } from "@/types/species";

/* ─── Kingdom → color mapping ───────────────────────────────────────────── */

const kingdomColors: Record<string, string> = {
    Plantae:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Animalia:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Fungi: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    Protista:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    Chromista:
        "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
};

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface SpeciesCardProps {
    species: SpeciesListItem;
    viewMode?: ViewMode;
    className?: string;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function SpeciesCard({
    species,
    viewMode = "grid",
    className,
}: SpeciesCardProps) {
    const isListView = viewMode === "list";

    return (
        <Link
            href={`/catalog/${species.slug}`}
            className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label={`Ver detalle de ${species.commonName ?? species.scientificName}`}
        >
            <Card
                className={cn(
                    "overflow-hidden pt-0 transition-all duration-200 hover:shadow-md hover:border-primary/30 group-focus-visible:border-primary/30",
                    isListView && "flex flex-row pb-0",
                    className,
                )}
            >
                {/* ── Image ────────────────────────────────────────────── */}
                <div
                    className={cn(
                        "relative overflow-hidden bg-muted",
                        isListView
                            ? "h-32 w-32 shrink-0 sm:h-36 sm:w-36"
                            : "aspect-[4/3] w-full",
                    )}
                >
                    {species.thumbnailUrl ? (
                        <SmartImage
                            src={species.thumbnailUrl}
                            alt={`Fotografía de ${species.commonName ?? species.scientificName}`}
                            fill
                            sizes={
                                isListView
                                    ? "144px"
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

                    {/* Sensitive badge overlay */}
                    {species.isSensitive && (
                        <div className="absolute left-2 top-2">
                            <Badge
                                variant="destructive"
                                className="gap-1 text-xs"
                            >
                                <ShieldAlert className="h-3 w-3" />
                                Sensible
                            </Badge>
                        </div>
                    )}
                </div>

                {/* ── Content ──────────────────────────────────────────── */}
                <div className="flex flex-1 flex-col py-4">
                    <CardHeader
                        className={cn("gap-1", isListView ? "pb-2" : "pb-2")}
                    >
                        <h3
                            className="line-clamp-1 text-sm font-semibold leading-tight group-hover:text-primary transition-colors"
                            title={species.scientificName}
                        >
                            <span className="italic">
                                {species.scientificName}
                            </span>
                        </h3>
                        {species.commonName && (
                            <p
                                className="line-clamp-1 text-sm text-muted-foreground"
                                title={species.commonName}
                            >
                                {species.commonName}
                            </p>
                        )}
                    </CardHeader>

                    <CardContent className="pb-2 pt-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {/* Kingdom badge */}
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[11px] font-medium",
                                    kingdomColors[species.kingdom],
                                )}
                            >
                                {species.kingdom}
                            </Badge>

                            {/* Family */}
                            {species.family && (
                                <Badge
                                    variant="secondary"
                                    className="text-[11px] font-normal"
                                >
                                    {species.family}
                                </Badge>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="mt-auto pt-0">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            Ver detalle
                        </span>
                    </CardFooter>
                </div>
            </Card>
        </Link>
    );
}

/* ─── Skeleton ──────────────────────────────────────────────────────────── */

export function SpeciesCardSkeleton({
    viewMode = "grid",
}: {
    viewMode?: ViewMode;
}) {
    const isListView = viewMode === "list";

    return (
        <Card
            className={cn(
                "overflow-hidden pt-0",
                isListView && "flex flex-row pb-0",
            )}
        >
            <Skeleton
                className={cn(
                    isListView
                        ? "h-32 w-32 shrink-0 sm:h-36 sm:w-36"
                        : "aspect-[4/3] w-full",
                )}
            />
            <div className="flex flex-1 flex-col p-4 gap-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-1.5 mt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="mt-auto h-3 w-20" />
            </div>
        </Card>
    );
}
