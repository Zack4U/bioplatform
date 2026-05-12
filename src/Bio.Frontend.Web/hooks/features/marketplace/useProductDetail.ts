/**
 * useProductDetail — full product detail hook.
 *
 * Orchestrates all logic for the product detail page:
 *   - Product fetch by slug (React Query)
 *   - Reviews fetch + submission mutation
 *   - Favorite toggle with optimistic update
 *   - Selected image index tracking
 *   - Review form open/close state
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *  - This hook → ALL logic
 *  - ProductDetailView / ProductGallery / ReviewSection → UI ONLY
 *
 * @module hooks/features/marketplace/useProductDetail
 */

"use client";

import {
  checkFavorite,
  createReview,
  getProductBySlug,
  getProductReviews,
  toggleFavorite,
} from "@/services/marketplace-service";
import { useAuthStore } from "@/store/auth-store";
import type {
  CreateReviewRequest,
  FavoriteStatus,
  ProductDetailDTO,
  Review,
} from "@/types/marketplace";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProductDetail(slug: string) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // ── Local UI state ─────────────────────────────────────────────────────

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  // ── Product detail ─────────────────────────────────────────────────────

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ProductDetailDTO | null>({
    queryKey: ["marketplace", "product", slug],
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });

  // ── Reviews ────────────────────────────────────────────────────────────

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery<
    Review[]
  >({
    queryKey: ["marketplace", "reviews", product?.id],
    queryFn: () => getProductReviews(product!.id),
    enabled: !!product?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // ── Review submission ──────────────────────────────────────────────────

  const { mutate: submitReview, isPending: isSubmittingReview } = useMutation({
    mutationFn: (data: CreateReviewRequest) => {
      if (!product?.id) {
        return Promise.reject(new Error("Product not loaded"));
      }
      return createReview(product.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "reviews", product?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "product", slug],
      });
      setIsReviewFormOpen(false);
      toast.success("Resena publicada exitosamente.");
    },
    onError: () => {
      toast.error("No se pudo publicar la resena. Intenta de nuevo.");
    },
  });

  // ── Favorite status check ──────────────────────────────────────────────

  const { data: favoriteStatus } = useQuery<FavoriteStatus>({
    queryKey: ["favorites", "check", product?.id],
    queryFn: () => checkFavorite(product!.id),
    enabled: !!product?.id && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // ── Favorite toggle (optimistic update) ───────────────────────────────

  const { mutate: toggleFavoriteAction, isPending: isTogglingFavorite } =
    useMutation({
      mutationFn: () => {
        if (!product?.id) {
          return Promise.reject(new Error("Product not loaded"));
        }
        return toggleFavorite(product.id);
      },
      onMutate: async () => {
        if (!product?.id) return;

        const queryKey = ["favorites", "check", product.id];

        // Cancel any in-flight refetch so it doesn't overwrite our optimistic value
        await queryClient.cancelQueries({ queryKey });

        // Snapshot previous value for rollback
        const previous = queryClient.getQueryData<FavoriteStatus>(queryKey);

        // Optimistically flip the flag
        queryClient.setQueryData<FavoriteStatus>(queryKey, (old) => {
          if (!old) {
            return { productId: product.id, isFavorite: true };
          }
          return { ...old, isFavorite: !old.isFavorite };
        });

        return { previous };
      },
      onError: (_err, _vars, context) => {
        // Roll back on error
        if (context?.previous && product?.id) {
          queryClient.setQueryData(
            ["favorites", "check", product.id],
            context.previous,
          );
        }
        toast.error("No se pudo actualizar el favorito. Intenta de nuevo.");
      },
      onSuccess: (result) => {
        // Sync the authoritative value from the server
        if (product?.id) {
          queryClient.setQueryData<FavoriteStatus>(
            ["favorites", "check", product.id],
            result,
          );
        }
        // Invalidate the full favorites list so it stays in sync
        queryClient.invalidateQueries({ queryKey: ["favorites"] });

        toast.success(
          result.isFavorite
            ? "Producto agregado a favoritos."
            : "Producto eliminado de favoritos.",
        );
      },
    });

  // ── Public API ─────────────────────────────────────────────────────────

  return {
    // Product
    product: product ?? null,
    isLoading,
    isError,
    error,
    refetch,

    // Reviews
    reviews,
    isLoadingReviews,
    submitReview,
    isSubmittingReview,

    // Favorites
    isFavorite: favoriteStatus?.isFavorite ?? false,
    isTogglingFavorite,
    toggleFavorite: toggleFavoriteAction,

    // Image gallery
    selectedImageIndex,
    setSelectedImageIndex,

    // Review form
    isReviewFormOpen,
    setIsReviewFormOpen,
  };
}
