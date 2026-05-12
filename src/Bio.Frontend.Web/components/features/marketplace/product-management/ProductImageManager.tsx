"use client";

/**
 * ProductImageManager — Sheet (drawer) for managing a product's image gallery.
 *
 * Features:
 *  - Responsive 2-3 column grid of existing images using SmartImage.
 *  - "Principal" badge + "Hacer principal" / "Eliminar" action buttons per image.
 *  - Drag-and-drop + click-to-select upload zone with inline file preview.
 *  - Optional altText input + isPrimary checkbox before submitting.
 *  - Progress bar during upload (uploadProgress 0-100).
 *  - File constraints: jpg/png/webp, max 10 MB.
 *
 * UI ONLY — no fetching logic. All state and callbacks come from the parent.
 *
 * WCAG 2.1 AA:
 *  - Images have meaningful alt text (or "sin descripcion" fallback).
 *  - Upload zone has role="button" with keyboard activation.
 *  - Progress bar has aria-valuenow/min/max.
 *  - Loading spinners have aria-label.
 *
 * @module components/features/marketplace/product-management/ProductImageManager
 */

import { SmartImage } from "@/components/common/SmartImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { ManageProductListItem, ProductImage } from "@/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Package,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductImageManagerProps {
  isOpen: boolean;
  onClose: () => void;
  product: ManageProductListItem | null;
  images: ProductImage[];
  isLoadingImages: boolean;
  onUpload: (file: File, isPrimary: boolean, altText: string) => void;
  onDelete: (imageId: string) => void;
  onSetPrimary: (imageId: string) => void;
  isUploading: boolean;
  uploadProgress: number;
  isDeleting: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductImageManager({
  isOpen,
  onClose,
  product,
  images,
  isLoadingImages,
  onUpload,
  onDelete,
  onSetPrimary,
  isUploading,
  uploadProgress,
  isDeleting,
}: ProductImageManagerProps) {
  // ── Upload form state ──────────────────────────────────────────────────

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File selection / validation ────────────────────────────────────────

  function handleFileSelect(file: File) {
    setFileError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Solo se permiten imagenes JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`El archivo no puede superar ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  function clearSelection() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setAltText("");
    setIsPrimary(false);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // ── Drag-and-drop handlers ─────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleKeyDownZone(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }

  // ── Submit upload ──────────────────────────────────────────────────────

  function handleUploadSubmit() {
    if (!selectedFile) return;
    onUpload(selectedFile, isPrimary, altText);
    clearSelection();
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-lg overflow-y-auto"
        aria-label="Gestionar imagenes del producto"
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" aria-hidden="true" />
            Galeria de imagenes
          </SheetTitle>
          <SheetDescription>
            {product
              ? `Gestiona las imagenes de "${product.name}".`
              : "Cargando producto..."}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-2">
          {/* ── Existing images grid ──────────────────────────────── */}
          <section aria-label="Imagenes actuales">
            <h3 className="mb-3 text-sm font-semibold">
              Imagenes actuales
              {images.length > 0 && (
                <span className="ml-1.5 text-muted-foreground font-normal">
                  ({images.length})
                </span>
              )}
            </h3>

            {isLoadingImages ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <ImagePlus className="h-8 w-8" aria-hidden="true" />
                <p className="text-sm">Sin imagenes. Sube la primera.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {images.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    onDelete={onDelete}
                    onSetPrimary={onSetPrimary}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* ── Upload section ─────────────────────────────────────── */}
          <section aria-label="Subir nueva imagen">
            <h3 className="mb-3 text-sm font-semibold">Subir nueva imagen</h3>

            {/* ── Drop zone / preview ─────────────────────────────── */}
            {previewUrl && selectedFile ? (
              <div className="flex flex-col gap-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                  <SmartImage
                    src={previewUrl}
                    alt="Vista previa de la imagen seleccionada"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedFile.name} —{" "}
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                aria-label="Zona de carga de imagen. Haz clic o arrastra un archivo aqui."
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={handleKeyDownZone}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors select-none",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                <UploadCloud
                  className="h-10 w-10 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Arrastra una imagen o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG o WebP — max. {MAX_FILE_SIZE_MB} MB
                  </p>
                </div>
              </div>
            )}

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="sr-only"
              onChange={handleInputChange}
              aria-hidden="true"
              tabIndex={-1}
            />

            {/* File error */}
            {fileError && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {fileError}
              </p>
            )}

            {/* Alt text + isPrimary — only when a file is selected */}
            {selectedFile && (
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="img-alt-text">
                    Texto alternativo (opcional)
                  </Label>
                  <Input
                    id="img-alt-text"
                    placeholder="Ej: Frasco de 250g de miel dorada"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    maxLength={200}
                    aria-describedby="img-alt-hint"
                  />
                  <p
                    id="img-alt-hint"
                    className="text-xs text-muted-foreground"
                  >
                    Describe la imagen para mejorar la accesibilidad y el SEO.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="img-is-primary"
                    checked={isPrimary}
                    onCheckedChange={(checked) =>
                      setIsPrimary(checked === true)
                    }
                  />
                  <Label htmlFor="img-is-primary" className="cursor-pointer">
                    Establecer como imagen principal
                  </Label>
                </div>
              </div>
            )}

            {/* Upload progress bar */}
            {isUploading && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden="true"
                    />
                    Subiendo imagen...
                  </span>
                  <span aria-live="polite">{uploadProgress}%</span>
                </div>
                <Progress
                  value={uploadProgress}
                  aria-label="Progreso de carga"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              {selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearSelection}
                  disabled={isUploading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="button"
                onClick={
                  selectedFile
                    ? handleUploadSubmit
                    : () => fileInputRef.current?.click()
                }
                disabled={isUploading || (!!selectedFile && !!fileError)}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Subiendo...
                  </>
                ) : selectedFile ? (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" aria-hidden="true" />
                    Subir imagen
                  </>
                ) : (
                  <>
                    <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Seleccionar imagen
                  </>
                )}
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Image card ───────────────────────────────────────────────────────────────

interface ImageCardProps {
  image: ProductImage;
  onDelete: (imageId: string) => void;
  onSetPrimary: (imageId: string) => void;
  isDeleting: boolean;
}

function ImageCard({
  image,
  onDelete,
  onSetPrimary,
  isDeleting,
}: ImageCardProps) {
  return (
    <div className="group relative flex flex-col gap-1.5">
      {/* Image thumbnail */}
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        <SmartImage
          src={image.imageUrl}
          alt={image.altText ?? `Imagen de producto`}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-105"
          sizes="(max-width: 640px) 33vw, 150px"
        />

        {/* Primary badge overlay */}
        {image.isPrimary && (
          <div className="absolute left-1 top-1">
            <Badge
              variant="default"
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] leading-none"
            >
              <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
              Principal
            </Badge>
          </div>
        )}

        {/* Action overlay buttons */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          {!image.isPrimary && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onSetPrimary(image.id)}
              aria-label="Establecer como imagen principal"
              className="h-7 px-2 text-[11px]"
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Principal
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => onDelete(image.id)}
            disabled={isDeleting}
            aria-label="Eliminar imagen"
            className="h-7 px-2 text-[11px]"
          >
            {isDeleting ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            )}
            Eliminar
          </Button>
        </div>
      </div>

      {/* Alt text truncated below card */}
      {image.altText && (
        <p className="truncate px-0.5 text-[11px] text-muted-foreground">
          {image.altText}
        </p>
      )}
    </div>
  );
}
