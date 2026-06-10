/**
 * ImageLightbox — fullscreen image viewer with zoom, pan, and navigation.
 *
 * Google Photos-like experience:
 *   - Click to toggle zoom (1x ↔ 2.5x)
 *   - Mouse wheel for incremental zoom
 *   - Drag to pan when zoomed
 *   - Keyboard: Escape (close), Arrow keys (nav), +/- (zoom)
 *   - Touch: pinch-to-zoom, drag to pan
 *   - Prev/Next navigation buttons
 *
 * UI ONLY — receives all state and callbacks via props from useSpeciesGallery.
 *
 * @module components/features/species/ImageLightbox
 */

"use client";

import { SmartImage } from "@/components/common/SmartImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SpeciesImage } from "@/types/species";
import {
    ChevronLeft,
    ChevronRight,
    Minus,
    Move,
    Plus,
    RotateCcw,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ImageLightboxProps {
    image: SpeciesImage;
    currentIndex: number;
    totalImages: number;
    zoom: number;
    pan: { x: number; y: number };
    onClose: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onToggleZoom: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
    onWheel: (deltaY: number) => void;
    onPanChange: (pan: { x: number; y: number }) => void;
}

export function ImageLightbox({
    image,
    currentIndex,
    totalImages,
    zoom,
    pan,
    onClose,
    onNext,
    onPrevious,
    onToggleZoom,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onWheel,
    onPanChange,
}: ImageLightboxProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const panStart = useRef({ x: 0, y: 0 });
    const [isDraggingState, setIsDraggingState] = useState(false);

    /* ── Keyboard navigation ───────────────────────────────────────── */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "Escape":
                    onClose();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    onNext();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    onPrevious();
                    break;
                case "+":
                case "=":
                    e.preventDefault();
                    onZoomIn();
                    break;
                case "-":
                    e.preventDefault();
                    onZoomOut();
                    break;
                case "0":
                    e.preventDefault();
                    onResetZoom();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, onNext, onPrevious, onZoomIn, onZoomOut, onResetZoom]);

    /* ── Lock body scroll ──────────────────────────────────────────── */
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    /* ── Mouse wheel zoom ──────────────────────────────────────────── */
    const handleWheelEvent = useCallback(
        (e: React.WheelEvent) => {
            e.preventDefault();
            onWheel(e.deltaY);
        },
        [onWheel],
    );

    /* ── Drag to pan (mouse) ───────────────────────────────────────── */
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            dragStart.current = { x: e.clientX, y: e.clientY };
            if (zoom <= 1) return;
            e.preventDefault();
            isDragging.current = true;
            setIsDraggingState(true);
            panStart.current = { ...pan };
        },
        [zoom, pan],
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging.current) return;
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            onPanChange({
                x: panStart.current.x + dx,
                y: panStart.current.y + dy,
            });
        },
        [onPanChange],
    );

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        setIsDraggingState(false);
    }, []);

    /* ── Touch pan ─────────────────────────────────────────────────── */
    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (e.touches.length !== 1) return;
            dragStart.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
            if (zoom <= 1) return;
            isDragging.current = true;
            setIsDraggingState(true);
            panStart.current = { ...pan };
        },
        [zoom, pan],
    );

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!isDragging.current || e.touches.length !== 1) return;
            const dx = e.touches[0].clientX - dragStart.current.x;
            const dy = e.touches[0].clientY - dragStart.current.y;
            onPanChange({
                x: panStart.current.x + dx,
                y: panStart.current.y + dy,
            });
        },
        [onPanChange],
    );

    const handleTouchEnd = useCallback(() => {
        isDragging.current = false;
        setIsDraggingState(false);
    }, []);

    /* ── Click on image (toggle zoom) ──────────────────────────────── */
    const handleImageClick = useCallback(
        (e: React.MouseEvent) => {
            // Ignore if we were dragging
            if (
                Math.abs(e.clientX - dragStart.current.x) > 5 ||
                Math.abs(e.clientY - dragStart.current.y) > 5
            ) {
                return;
            }
            onToggleZoom();
        },
        [onToggleZoom],
    );

    /* ── Format date ───────────────────────────────────────────────── */
    const formattedDate = new Intl.DateTimeFormat("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date(image.createdAt));

    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < totalImages - 1;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Visor de imagen"
            onWheel={handleWheelEvent}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* ── Top bar ──────────────────────────────────────────── */}
            <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
                <div className="flex items-center gap-2">
                    <Badge
                        variant="secondary"
                        className="bg-white/10 text-white backdrop-blur-md"
                    >
                        {currentIndex + 1} / {totalImages}
                    </Badge>
                    {image.isValidatedByExpert && (
                        <Badge className="bg-emerald-500/80 text-white backdrop-blur-md">
                            Validada
                        </Badge>
                    )}
                    <Badge
                        variant="outline"
                        className="border-white/20 text-white/70"
                    >
                        {image.licenseType}
                    </Badge>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={onClose}
                    aria-label="Cerrar visor"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* ── Navigation arrows ────────────────────────────────── */}
            {hasPrev && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 z-10 h-12 w-12 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
                    onClick={onPrevious}
                    aria-label="Imagen anterior"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
            )}

            {hasNext && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 z-10 h-12 w-12 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
                    onClick={onNext}
                    aria-label="Siguiente imagen"
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>
            )}

            {/* ── Main image area ──────────────────────────────────── */}
            <div
                className="flex h-full w-full items-center justify-center overflow-hidden"
                style={{
                    cursor: zoom > 1
                        ? isDraggingState
                            ? "grabbing"
                            : "grab"
                        : "zoom-in",
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onClick={handleImageClick}
            >
                <div
                    className="relative transition-transform duration-200 ease-out"
                    style={{
                        transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                        willChange: "transform",
                    }}
                >
                    <SmartImage
                        src={image.imageUrl}
                        alt={`Imagen de especie ${currentIndex + 1}`}
                        width={1200}
                        height={800}
                        className="max-h-[85vh] w-auto max-w-[90vw] select-none rounded object-contain"
                        priority
                        draggable={false}
                        unoptimized={true}
                    />
                </div>
            </div>

            {/* ── Bottom bar — zoom controls & info ────────────────── */}
            <div className="absolute right-0 bottom-0 left-0 z-10 flex flex-col items-center justify-end gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pb-8 pointer-events-none">
                <TooltipProvider delayDuration={300}>
                    <div className="flex items-center gap-1 rounded-full bg-black/50 px-4 py-2 backdrop-blur-md border border-white/10 pointer-events-auto">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onZoomOut();
                                    }}
                                    disabled={zoom <= 1}
                                    aria-label="Alejar"
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Alejar (-)</TooltipContent>
                        </Tooltip>

                        <span className="min-w-[3rem] text-center text-xs font-medium text-white/90">
                            {Math.round(zoom * 100)}%
                        </span>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onZoomIn();
                                    }}
                                    disabled={zoom >= 5}
                                    aria-label="Acercar"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Acercar (+)</TooltipContent>
                        </Tooltip>

                        <div className="w-px h-4 bg-white/20 mx-1"></div>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onResetZoom();
                                    }}
                                    aria-label="Restablecer zoom"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Restablecer (0)</TooltipContent>
                        </Tooltip>

                        {zoom > 1 && (
                            <>
                                <div className="w-px h-4 bg-white/20 mx-1"></div>
                                <div className="ml-1 flex items-center gap-1.5 text-xs text-white/70">
                                    <Move className="h-3 w-3" />
                                    <span className="hidden sm:inline">Arrastra para mover</span>
                                </div>
                            </>
                        )}
                    </div>
                </TooltipProvider>

                <p className="text-xs text-white/70 font-medium pointer-events-auto bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                    {formattedDate}
                </p>
            </div>
        </div>
    );
}
