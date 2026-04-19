/**
 * SpeciesImageGallery — image gallery section for species detail page.
 *
 * Features:
 *   - Responsive masonry-like grid (2 cols mobile, 3 md, 4 lg)
 *   - Infinite scroll with IntersectionObserver sentinel
 *   - Expert-validation filter toggle
 *   - Stagger-reveal animation for smooth batch loading
 *   - Click to open fullscreen ImageLightbox
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 * All logic is in useSpeciesGallery hook. This component is UI ONLY.
 *
 * @module components/features/species/SpeciesImageGallery
 */

"use client";

import { SmartImage } from "@/components/common/SmartImage";
import { ImageLightbox } from "@/components/features/species/ImageLightbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpeciesGallery } from "@/hooks/features/catalog/useSpeciesGallery";
import {
    Camera,
    CheckCircle2,
    ImageOff,
    Loader2,
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

interface SpeciesImageGalleryProps {
    speciesId: string;
}

export function SpeciesImageGallery({ speciesId }: SpeciesImageGalleryProps) {
    const {
        images,
        allImages,
        totalCount,
        selectedImage,
        selectedIndex,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        onlyValidated,
        setOnlyValidated,
        openLightbox,
        closeLightbox,
        goToNext,
        goToPrevious,
        zoom,
        pan,
        setPan,
        toggleZoom,
        zoomIn,
        zoomOut,
        resetZoom,
        handleWheel,
    } = useSpeciesGallery({ speciesId });

    /* ── Infinite scroll sentinel ──────────────────────────────────── */
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { rootMargin: "200px" },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    /* ── Handle filter toggle ──────────────────────────────────────── */
    const handleFilterToggle = useCallback(() => {
        setOnlyValidated((prev: boolean) => !prev);
    }, [setOnlyValidated]);

    /* ── Loading state ─────────────────────────────────────────────── */
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Camera className="h-4 w-4 text-primary" />
                        Galería de Imágenes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton
                                key={`gallery-skeleton-${i}`}
                                className="aspect-square w-full rounded-lg"
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    /* ── Error state ───────────────────────────────────────────────── */
    if (isError) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Camera className="h-4 w-4 text-primary" />
                        Galería de Imágenes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ImageOff
                            className="mb-2 h-8 w-8 text-muted-foreground/40"
                            aria-hidden="true"
                        />
                        <p className="text-sm text-muted-foreground">
                            No se pudieron cargar las imágenes. Intenta nuevamente.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    /* ── Empty state ───────────────────────────────────────────────── */
    if (totalCount === 0 && !isLoading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Camera className="h-4 w-4 text-primary" />
                        Galería de Imágenes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ImageOff
                            className="mb-2 h-8 w-8 text-muted-foreground/40"
                            aria-hidden="true"
                        />
                        <p className="text-sm text-muted-foreground">
                            Aún no hay imágenes disponibles para esta especie.
                        </p>
                        {onlyValidated && (
                            <Button
                                variant="link"
                                className="mt-2 text-xs"
                                onClick={handleFilterToggle}
                            >
                                Ver todas las imágenes (sin filtro de validación)
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    /* ── Gallery view ──────────────────────────────────────────────── */
    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Camera className="h-4 w-4 text-primary" />
                            Galería de Imágenes
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {totalCount}
                            </Badge>
                        </CardTitle>

                        <Button
                            variant={onlyValidated ? "default" : "outline"}
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={handleFilterToggle}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Solo validadas por experto
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* ── Image Grid ────────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                        {images.map((image, index) => (
                            <button
                                type="button"
                                key={image.id}
                                className="group relative aspect-square overflow-hidden rounded-lg bg-muted ring-offset-background transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                onClick={() => openLightbox(index)}
                                aria-label={`Ver imagen ${index + 1} en pantalla completa`}
                                style={{
                                    animationDelay: `${(index % 6) * 50}ms`,
                                }}
                            >
                                <SmartImage
                                    src={image.thumbnailUrl ?? image.imageUrl}
                                    alt={`Imagen de especie ${index + 1}`}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />

                                {/* Hover overlay */}
                                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <div className="flex items-center gap-1">
                                        {image.isPrimary && (
                                            <Badge className="bg-primary/80 text-[10px] text-white">
                                                Principal
                                            </Badge>
                                        )}
                                        {image.isValidatedByExpert && (
                                            <Badge className="bg-emerald-500/80 text-[10px] text-white">
                                                Validada
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}

                        {/* Loading skeletons while fetching next page */}
                        {isFetchingNextPage &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton
                                    key={`loading-${i}`}
                                    className="aspect-square w-full rounded-lg"
                                />
                            ))}
                    </div>

                    {/* ── Infinite scroll sentinel ──────────────────── */}
                    <div
                        ref={sentinelRef}
                        className="mt-4 flex justify-center"
                        aria-hidden="true"
                    >
                        {isFetchingNextPage && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando más imágenes...
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Lightbox ─────────────────────────────────────────── */}
            {selectedImage && selectedIndex !== null && (
                <ImageLightbox
                    image={selectedImage}
                    currentIndex={selectedIndex}
                    totalImages={allImages.length}
                    zoom={zoom}
                    pan={pan}
                    onClose={closeLightbox}
                    onNext={goToNext}
                    onPrevious={goToPrevious}
                    onToggleZoom={toggleZoom}
                    onZoomIn={zoomIn}
                    onZoomOut={zoomOut}
                    onResetZoom={resetZoom}
                    onWheel={handleWheel}
                    onPanChange={setPan}
                />
            )}
        </>
    );
}
