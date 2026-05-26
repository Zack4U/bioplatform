/**
 * ReviewForm — responsive review submission overlay.
 *
 * Desktop (md+) → Dialog (centered modal).
 * Mobile        → Drawer (bottom sheet — vaul).
 *
 * Uses useIsMd() from the global useMediaQuery hook for uniform
 * breakpoint detection across the entire application.
 *
 * Contains a 5-star rating selector and an optional comment textarea.
 * Validation: rating is required (1–5), comment is optional (max 1000 chars).
 *
 * UI ONLY — receives onSubmit from the parent hook, shows isSubmitting state.
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsMd } from "@/hooks/useMediaQuery";
import type { CreateReviewRequest } from "@/types/marketplace";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Star } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

/* ─── Validation schema ─────────────────────────────────────────────────── */

const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Selecciona al menos 1 estrella")
    .max(5, "La calificacion maxima es 5 estrellas"),
  comment: z
    .string()
    .max(1000, "El comentario no puede superar los 1000 caracteres")
    .catch(""),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReviewRequest) => void;
  isSubmitting: boolean;
  productName: string;
}

/* ─── Star selector sub-component ──────────────────────────────────────── */

function StarSelector({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (rating: number) => void;
  error?: string;
}) {
  const [hovered, setHovered] = useState<number>(0);

  const labels: Record<number, string> = {
    1: "Muy malo",
    2: "Malo",
    3: "Regular",
    4: "Bueno",
    5: "Excelente",
  };

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Calificacion de 1 a 5 estrellas"
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? "rating-error" : undefined}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"} — ${labels[star]}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm"
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                (hovered > 0 ? star <= hovered : star <= value)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/40",
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      {/* Label below stars */}
      {(hovered > 0 || value > 0) && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {labels[hovered > 0 ? hovered : value]}
        </p>
      )}
      {error && (
        <p id="rating-error" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Shared form body ───────────────────────────────────────────────────── */

function ReviewFormBody({
  ratingValue,
  commentValue,
  errors,
  isSubmitting,
  onClose,
  handleRatingChange,
  handleFormSubmit,
  register,
}: {
  ratingValue: number;
  commentValue: string;
  errors: ReturnType<typeof useForm<ReviewFormValues>>["formState"]["errors"];
  isSubmitting: boolean;
  onClose: () => void;
  handleRatingChange: (r: number) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  register: ReturnType<typeof useForm<ReviewFormValues>>["register"];
}) {
  return (
    <form
      onSubmit={handleFormSubmit}
      className="flex flex-col flex-1 gap-6 px-4 py-6 md:px-0"
      noValidate
    >
      {/* ── Star rating ─────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="rating-group" className="text-sm font-medium">
          Calificacion{" "}
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </Label>
        <div id="rating-group">
          <StarSelector
            value={ratingValue}
            onChange={handleRatingChange}
            error={errors.rating?.message}
          />
        </div>
      </div>

      {/* ── Comment textarea ─────────────────────────────── */}
      <div className="space-y-2 flex-1">
        <Label htmlFor="comment" className="text-sm font-medium">
          Comentario{" "}
          <span className="text-muted-foreground font-normal text-xs">
            (opcional)
          </span>
        </Label>
        <Textarea
          id="comment"
          placeholder="Cuéntanos tu experiencia con este producto..."
          className="resize-none min-h-[120px]"
          maxLength={1000}
          aria-describedby="comment-count"
          aria-invalid={!!errors.comment}
          {...register("comment")}
        />
        <div className="flex items-start justify-between gap-2">
          {errors.comment ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.comment.message}
            </p>
          ) : (
            <span />
          )}
          <p
            id="comment-count"
            className="text-xs text-muted-foreground text-right shrink-0"
            aria-live="polite"
            aria-atomic="true"
          >
            {commentValue.length}/1000
          </p>
        </div>
      </div>

      {/* ── Footer actions ───────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 mt-auto">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Enviando...
            </>
          ) : (
            "Publicar resena"
          )}
        </Button>
      </div>
    </form>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function ReviewForm({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  productName,
}: ReviewFormProps) {
  const isDesktop = useIsMd();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const ratingValue = useWatch({ control, name: "rating" });
  const commentValue = useWatch({ control, name: "comment" }) ?? "";

  const handleRatingChange = (rating: number) => {
    setValue("rating", rating, { shouldValidate: true });
  };

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit({
      rating: data.rating,
      comment: data.comment ?? "",
    });
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const formProps = {
    ratingValue,
    commentValue,
    errors,
    isSubmitting,
    onClose: handleClose,
    handleRatingChange,
    handleFormSubmit,
    register,
  };

  const subtitle = (
    <>
      Comparte tu opinion sobre{" "}
      <span className="font-medium text-foreground">{productName}</span>.
      Tu resena ayuda a otros compradores.
    </>
  );

  /* Desktop: centered Dialog */
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
          className="sm:max-w-md"
          aria-labelledby="review-form-title"
          aria-describedby="review-form-description"
        >
          <DialogHeader>
            <DialogTitle id="review-form-title">Escribir resena</DialogTitle>
            <DialogDescription id="review-form-description">
              {subtitle}
            </DialogDescription>
          </DialogHeader>
          <ReviewFormBody {...formProps} />
        </DialogContent>
      </Dialog>
    );
  }

  /* Mobile: bottom Drawer */
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent aria-labelledby="review-drawer-title" aria-describedby="review-drawer-description">
        <DrawerHeader className="text-left">
          <DrawerTitle id="review-drawer-title">Escribir resena</DrawerTitle>
          <DrawerDescription id="review-drawer-description">
            {subtitle}
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto">
          <ReviewFormBody {...formProps} />
        </div>
        <DrawerFooter className="pt-0" />
      </DrawerContent>
    </Drawer>
  );
}
