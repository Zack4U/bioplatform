/**
 * IdentifyUploadStep — Step 1 of the identification wizard.
 *
 * Drag-and-drop zone with file input for image upload.
 * Shows image preview after selection and model health status.
 * If user is not authenticated, prompts login before classifying.
 *
 * @module components/features/identification/IdentifyUploadStep
 */

"use client";

import { SmartImage } from "@/components/common/SmartImage";
import { Button } from "@/components/ui/button";
import { useHealthCheck } from "@/hooks/features/identification/useClassification";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
    Camera,
    ImagePlus,
    Loader2,
    ScanSearch,
    Trash2,
    Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

interface IdentifyUploadStepProps {
    selectedFile: File | null;
    previewUrl: string | null;
    onFileSelect: (file: File) => void;
    onClassify: () => void;
    onRetake: () => void;
    isProcessing: boolean;
    error: string | null;
}

export function IdentifyUploadStep({
    selectedFile,
    previewUrl,
    onFileSelect,
    onClassify,
    onRetake,
    isProcessing,
    error,
}: IdentifyUploadStepProps) {
    const { isAuthenticated } = useAuthStore();
    const { data: health, isLoading: isHealthLoading } = useHealthCheck();
    const isModelActive = health?.modelLoaded ?? false;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const file = e.dataTransfer.files[0];
            if (file) onFileSelect(file);
        },
        [onFileSelect],
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
            // Reset input so re-selecting same file works
            e.target.value = "";
        },
        [onFileSelect],
    );

    return (
        <div className="mx-auto w-full max-w-2xl space-y-6">
            {/* Health Status Indicator */}
            <div className="flex items-center justify-center gap-2 text-sm">
                <span
                    className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        isHealthLoading
                            ? "animate-pulse bg-amber-400"
                            : isModelActive
                              ? "bg-green-500"
                              : "bg-red-500",
                    )}
                    aria-hidden="true"
                />
                <span className="text-muted-foreground">
                    {isHealthLoading
                        ? "Verificando servicio de IA..."
                        : isModelActive
                          ? `Modelo CNN activo (${health?.numClasses ?? 0} especies)`
                          : "Modelo de IA no disponible"}
                </span>
            </div>

            {/* Upload Zone / Preview */}
            {!previewUrl ? (
                /* ── Drag-and-drop zone ─── */
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Subir imagen para identificar especie"
                    className={cn(
                        "group relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 transition-all duration-300",
                        isDragging
                            ? "border-primary bg-primary/5 scale-[1.02]"
                            : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50",
                    )}
                >
                    <div
                        className={cn(
                            "flex h-20 w-20 items-center justify-center rounded-2xl transition-colors duration-300",
                            isDragging
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                        )}
                    >
                        {isDragging ? (
                            <Upload className="h-10 w-10" />
                        ) : (
                            <ImagePlus className="h-10 w-10" />
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-lg font-semibold">
                            {isDragging
                                ? "Suelta la imagen aqui"
                                : "Arrastra una imagen o haz clic para subir"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            JPEG, PNG o WebP. Maximo {MAX_IMAGE_SIZE_MB} MB.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                        >
                            <Camera className="h-4 w-4" aria-hidden="true" />
                            Seleccionar archivo
                        </Button>
                    </div>
                </div>
            ) : (
                /* ── Preview ─── */
                <div className="relative overflow-hidden rounded-2xl border bg-muted">
                    <div className="relative aspect-[4/3] w-full">
                        <SmartImage
                            src={previewUrl}
                            alt="Imagen seleccionada para identificacion"
                            fill
                            className="object-contain"
                            provider="next"
                            unoptimized
                        />
                    </div>
                    <div className="flex items-center justify-between border-t px-4 py-3">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {selectedFile?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {selectedFile
                                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                                    : ""}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRetake}
                            className="gap-2 text-muted-foreground hover:text-destructive"
                            aria-label="Eliminar imagen seleccionada"
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Quitar
                        </Button>
                    </div>
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={handleInputChange}
                className="hidden"
                aria-hidden="true"
            />

            {/* Error message */}
            {error && (
                <p className="text-center text-sm text-destructive" role="alert">
                    {error}
                </p>
            )}

            {/* Action button */}
            <div className="flex justify-center">
                {isAuthenticated ? (
                    <Button
                        size="lg"
                        className="gap-3 rounded-xl px-8 text-base"
                        onClick={onClassify}
                        disabled={
                            !selectedFile || isProcessing || !isModelActive
                        }
                    >
                        {isProcessing ? (
                            <>
                                <Loader2
                                    className="h-5 w-5 animate-spin"
                                    aria-hidden="true"
                                />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <ScanSearch
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                />
                                Identificar Especie
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        className="gap-3 rounded-xl px-8 text-base"
                        asChild
                    >
                        <Link href="/login">
                            <ScanSearch
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                            Inicia sesion para identificar
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}
