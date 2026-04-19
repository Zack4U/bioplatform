/**
 * useSpeciesGallery — React Query hook for the species image gallery.
 *
 * Uses useInfiniteQuery for cursor-based infinite scroll pagination.
 * Provides state for:
 *   - Infinite-scrollable image list with stagger-delay batching
 *   - Expert-validation filter toggle
 *   - Selected image for lightbox
 *   - Zoom and pan state for lightbox viewer
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *
 * @module hooks/features/catalog/useSpeciesGallery
 */

"use client";

import { getSpeciesImages } from "@/services/species-service";
import type { SpeciesImage } from "@/types/species";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_PAGE_SIZE = 20;
const STAGGER_BATCH_SIZE = 6;
const STAGGER_DELAY_MS = 100;

interface UseSpeciesGalleryOptions {
    speciesId: string;
    enabled?: boolean;
}

export function useSpeciesGallery({
    speciesId,
    enabled = true,
}: UseSpeciesGalleryOptions) {
    /* ── Filter state ──────────────────────────────────────────────── */
    const [onlyValidated, setOnlyValidated] = useState(true);

    /* ── Lightbox state ────────────────────────────────────────────── */
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    /* ── Stagger reveal state ──────────────────────────────────────── */
    const [revealedCount, setRevealedCount] = useState(0);
    const revealTimerRef = useRef<NodeJS.Timeout | null>(null);

    /* ── Infinite query ────────────────────────────────────────────── */
    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["species", "images", speciesId, { onlyValidated }],
        queryFn: ({ pageParam = 1 }) =>
            getSpeciesImages(speciesId, {
                onlyValidatedByExpert: onlyValidated,
                page: pageParam,
                pageSize: DEFAULT_PAGE_SIZE,
            }),
        getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
        enabled: enabled && !!speciesId,
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 2,
    });

    /* ── Flatten all pages into single list ─────────────────────────── */
    const allImages = useMemo<SpeciesImage[]>(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.items);
    }, [data]);

    const totalCount = data?.pages[0]?.totalCount ?? 0;

    /* ── Stagger-reveal logic ──────────────────────────────────────── */
    useEffect(() => {
        if (allImages.length <= revealedCount) return;

        // Clear any existing timer
        if (revealTimerRef.current) {
            clearTimeout(revealTimerRef.current);
        }

        const revealNext = () => {
            setRevealedCount((prev) => {
                const next = Math.min(prev + STAGGER_BATCH_SIZE, allImages.length);
                if (next < allImages.length) {
                    revealTimerRef.current = setTimeout(revealNext, STAGGER_DELAY_MS);
                }
                return next;
            });
        };

        revealTimerRef.current = setTimeout(revealNext, STAGGER_DELAY_MS);

        return () => {
            if (revealTimerRef.current) {
                clearTimeout(revealTimerRef.current);
            }
        };
    }, [allImages.length, revealedCount]);

    // Reset revealed count when filter changes
    useEffect(() => {
        setRevealedCount(0);
    }, [onlyValidated]);

    const visibleImages = useMemo(
        () => allImages.slice(0, revealedCount),
        [allImages, revealedCount],
    );

    /* ── Lightbox controls ─────────────────────────────────────────── */
    const openLightbox = useCallback((index: number) => {
        setSelectedIndex(index);
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const closeLightbox = useCallback(() => {
        setSelectedIndex(null);
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const goToNext = useCallback(() => {
        setSelectedIndex((prev) => {
            if (prev === null) return null;
            const next = prev + 1;
            if (next >= allImages.length) return prev;
            setZoom(1);
            setPan({ x: 0, y: 0 });
            return next;
        });
    }, [allImages.length]);

    const goToPrevious = useCallback(() => {
        setSelectedIndex((prev) => {
            if (prev === null || prev <= 0) return prev;
            setZoom(1);
            setPan({ x: 0, y: 0 });
            return prev - 1;
        });
    }, []);

    const toggleZoom = useCallback(() => {
        setZoom((prev) => {
            if (prev > 1) {
                setPan({ x: 0, y: 0 });
                return 1;
            }
            return 2.5;
        });
    }, []);

    const zoomIn = useCallback(() => {
        setZoom((prev) => Math.min(prev + 0.5, 5));
    }, []);

    const zoomOut = useCallback(() => {
        setZoom((prev) => {
            const next = Math.max(prev - 0.5, 1);
            if (next === 1) setPan({ x: 0, y: 0 });
            return next;
        });
    }, []);

    const resetZoom = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const handleWheel = useCallback((deltaY: number) => {
        setZoom((prev) => {
            const next = deltaY < 0
                ? Math.min(prev + 0.25, 5)
                : Math.max(prev - 0.25, 1);
            if (next === 1) setPan({ x: 0, y: 0 });
            return next;
        });
    }, []);

    const selectedImage =
        selectedIndex !== null ? allImages[selectedIndex] ?? null : null;

    return {
        /* Data */
        images: visibleImages,
        allImages,
        totalCount,
        selectedImage,
        selectedIndex,

        /* Loading states */
        isLoading,
        isError,
        error,
        isFetchingNextPage,
        hasNextPage: hasNextPage ?? false,

        /* Pagination */
        fetchNextPage,

        /* Filter */
        onlyValidated,
        setOnlyValidated,

        /* Lightbox controls */
        openLightbox,
        closeLightbox,
        goToNext,
        goToPrevious,

        /* Zoom & Pan */
        zoom,
        pan,
        setPan,
        toggleZoom,
        zoomIn,
        zoomOut,
        resetZoom,
        handleWheel,
    };
}
