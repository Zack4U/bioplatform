/**
 * IdentificationHistory — sidebar/drawer of recent identifications.
 *
 * Reads from the Zustand identification store (localStorage-backed).
 * Shows thumbnail, species name, confidence, and timestamp for each entry.
 * Clicking an entry links to the catalog detail page.
 *
 * @module components/features/identification/IdentificationHistory
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useIdentificationStore } from "@/store/identification-store";
import { cn } from "@/lib/utils";
import {
    Clock,
    History,
    Trash2,
    X,
} from "lucide-react";
import Link from "next/link";

// ── Helper ───────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
    });
}

// ── Desktop Sidebar ──────────────────────────────────────────────────────────

export function IdentificationHistorySidebar({
    className,
}: {
    className?: string;
}) {
    const { history, removeRecord, clearHistory } = useIdentificationStore();

    if (history.length === 0) {
        return (
            <Card className={cn("w-72", className)}>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <History
                            className="h-4 w-4"
                            aria-hidden="true"
                        />
                        Historial
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-xs text-muted-foreground">
                        Tus identificaciones recientes apareceran aqui.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-72", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <History
                            className="h-4 w-4"
                            aria-hidden="true"
                        />
                        Historial ({history.length})
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHistory}
                        className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    >
                        <Trash2
                            className="mr-1 h-3 w-3"
                            aria-hidden="true"
                        />
                        Limpiar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="max-h-[60vh] space-y-2 overflow-y-auto pb-2">
                {history.map((record) => {
                    const topPred = record.result.predictions[0];
                    const confidence = Math.round(topPred.confidence * 100);
                    const slug = topPred.species
                        .toLowerCase()
                        .replace(/\s+/g, "-");

                    return (
                        <Link
                            key={record.id}
                            href={`/catalog/${slug}`}
                            className="group flex items-start gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted"
                        >
                            {/* Thumbnail */}
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={record.imagePreviewUrl}
                                    alt={topPred.species}
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {topPred.speciesData?.commonName ??
                                        topPred.species}
                                </p>
                                <p className="truncate text-xs italic text-muted-foreground">
                                    {topPred.species}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span
                                        className={cn(
                                            "font-medium",
                                            confidence >= 80
                                                ? "text-green-600 dark:text-green-400"
                                                : confidence >= 50
                                                  ? "text-amber-600 dark:text-amber-400"
                                                  : "text-red-600 dark:text-red-400",
                                        )}
                                    >
                                        {confidence}%
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock
                                            className="h-3 w-3"
                                            aria-hidden="true"
                                        />
                                        {formatRelativeTime(record.timestamp)}
                                    </span>
                                </div>
                            </div>

                            {/* Remove button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeRecord(record.id);
                                }}
                                aria-label="Eliminar del historial"
                            >
                                <X
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                />
                            </Button>
                        </Link>
                    );
                })}
            </CardContent>
        </Card>
    );
}

// ── Mobile Sheet ─────────────────────────────────────────────────────────────

export function IdentificationHistoryMobile() {
    const { history, removeRecord, clearHistory } = useIdentificationStore();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <History className="h-4 w-4" aria-hidden="true" />
                    Historial
                    {history.length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {history.length}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <History
                            className="h-4 w-4"
                            aria-hidden="true"
                        />
                        Historial de Identificaciones
                    </SheetTitle>
                    <SheetDescription>
                        Tus identificaciones recientes guardadas localmente.
                    </SheetDescription>
                </SheetHeader>

                {history.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <History className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                            Aun no has identificado ninguna especie.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end px-1 pb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearHistory}
                                className="h-7 text-xs text-muted-foreground hover:text-destructive"
                            >
                                <Trash2
                                    className="mr-1 h-3 w-3"
                                    aria-hidden="true"
                                />
                                Limpiar todo
                            </Button>
                        </div>
                        <div className="max-h-[70vh] space-y-2 overflow-y-auto">
                            {history.map((record) => {
                                const topPred = record.result.predictions[0];
                                const confidence = Math.round(
                                    topPred.confidence * 100,
                                );
                                const slug = topPred.species
                                    .toLowerCase()
                                    .replace(/\s+/g, "-");

                                return (
                                    <SheetClose key={record.id} asChild>
                                        <Link
                                            href={`/catalog/${slug}`}
                                            className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                                        >
                                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={
                                                        record.imagePreviewUrl
                                                    }
                                                    alt={topPred.species}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {topPred.speciesData
                                                        ?.commonName ??
                                                        topPred.species}
                                                </p>
                                                <p className="truncate text-xs italic text-muted-foreground">
                                                    {topPred.species}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span
                                                        className={cn(
                                                            "font-medium",
                                                            confidence >= 80
                                                                ? "text-green-600 dark:text-green-400"
                                                                : confidence >=
                                                                    50
                                                                  ? "text-amber-600 dark:text-amber-400"
                                                                  : "text-red-600 dark:text-red-400",
                                                        )}
                                                    >
                                                        {confidence}%
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock
                                                            className="h-3 w-3"
                                                            aria-hidden="true"
                                                        />
                                                        {formatRelativeTime(
                                                            record.timestamp,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 shrink-0 p-0 opacity-0 group-hover:opacity-100"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeRecord(record.id);
                                                }}
                                                aria-label="Eliminar del historial"
                                            >
                                                <X
                                                    className="h-3 w-3"
                                                    aria-hidden="true"
                                                />
                                            </Button>
                                        </Link>
                                    </SheetClose>
                                );
                            })}
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
