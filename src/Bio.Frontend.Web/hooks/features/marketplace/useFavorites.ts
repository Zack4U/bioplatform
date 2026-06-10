/**
 * useFavorites — user favorites list hook.
 *
 * Manages the authenticated user's favorite products:
 *   - Fetches full favorites list with React Query
 *   - isFavorite(productId) — O(1) lookup from local cache
 *   - toggleFavorite(productId) — mutation with full optimistic update + rollback
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *  - This hook → ALL logic
 *  - FavoritesPage / FavoriteButton → UI ONLY
 *
 * @module hooks/features/marketplace/useFavorites
 */

"use client";

import {
  getFavorites,
  toggleFavorite as toggleFavoriteService,
} from "@/services/marketplace-service";
import type {
  FavoriteStatus,
  PaginatedResponse,
  ProductListItem,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

// ─── Context types ──────────────────────────────────────────────────────────

interface ToggleFavoriteContext {
  previousList: PaginatedResponse<ProductListItem> | undefined;
  previousCheck: FavoriteStatus | undefined;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFavorites() {
  const queryClient = useQueryClient();

  // ── Favorites list ─────────────────────────────────────────────────────

  const { data, isLoading, isError, error, refetch } = useQuery<
    PaginatedResponse<ProductListItem>
  >({
    queryKey: ["favorites"],
    queryFn: getFavorites,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  // ── Derived: stable items array + O(1) lookup set ──────────────────────

  const favorites = useMemo<ProductListItem[]>(() => data?.items ?? [], [data]);

  const favoriteIdSet = useMemo<Set<string>>(
    () => new Set(favorites.map((p) => p.id)),
    [favorites],
  );

  const isFavorite = useCallback(
    (productId: string): boolean => favoriteIdSet.has(productId),
    [favoriteIdSet],
  );

  // ── Toggle favorite (optimistic update) ───────────────────────────────

  const { mutate: toggleFavorite, isPending: isTogglingFavorite } = useMutation<
    FavoriteStatus,
    Error,
    string,
    ToggleFavoriteContext
  >({
    mutationFn: (productId) => toggleFavoriteService(productId),
    onMutate: async (productId) => {
      const listKey = ["favorites"];
      const checkKey = ["favorites", "check", productId];

      // Cancel any in-flight refetches to prevent race conditions
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: checkKey }),
      ]);

      // Snapshot current values for rollback
      const previousList =
        queryClient.getQueryData<PaginatedResponse<ProductListItem>>(listKey);
      const previousCheck = queryClient.getQueryData<FavoriteStatus>(checkKey);

      const currentlyFavorite =
        previousList?.items.some((p) => p.id === productId) ?? false;

      if (currentlyFavorite) {
        // Optimistically remove from list
        queryClient.setQueryData<PaginatedResponse<ProductListItem>>(
          listKey,
          (old) => {
            if (!old) return old;
            const filtered = old.items.filter((p) => p.id !== productId);
            return {
              ...old,
              items: filtered,
              totalCount: old.totalCount - 1,
            };
          },
        );
      } else {
        // Optimistically add a placeholder so the heart fills immediately.
        // onSuccess invalidates ["favorites"], replacing it with the real product data.
        queryClient.setQueryData<PaginatedResponse<ProductListItem>>(
          listKey,
          (old) => {
            if (!old) return old;
            if (old.items.some((p) => p.id === productId)) return old;
            const placeholder = {
              id: productId,
              slug: "",
              name: "",
              thumbnailUrl: null,
              basePrice: 0,
              sellPrice: 0,
              stockQuantity: 0,
              isActive: true,
              categoryName: null,
              averageRating: 0,
              reviewCount: 0,
            } as ProductListItem;
            return {
              ...old,
              items: [placeholder, ...old.items],
              totalCount: old.totalCount + 1,
            };
          },
        );
      }

      // Optimistically flip the per-product check cache
      queryClient.setQueryData<FavoriteStatus>(checkKey, (old) => {
        if (!old) {
          return { productId, isFavorite: !currentlyFavorite };
        }
        return { ...old, isFavorite: !old.isFavorite };
      });

      return { previousList, previousCheck };
    },
    onError: (_err, productId, context) => {
      // Roll back list cache
      if (context?.previousList !== undefined) {
        queryClient.setQueryData(["favorites"], context.previousList);
      }
      // Roll back individual check cache
      if (context?.previousCheck !== undefined) {
        queryClient.setQueryData(
          ["favorites", "check", productId],
          context.previousCheck,
        );
      }
      toast.error("No se pudo actualizar el favorito. Intenta de nuevo.");
    },
    onSuccess: (result, productId) => {
      // Sync the authoritative server value into the check cache
      queryClient.setQueryData<FavoriteStatus>(
        ["favorites", "check", productId],
        result,
      );

      // Refetch the authoritative list so placeholder rows get real product data
      // (on add) and counts stay accurate (on remove).
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
    favorites,
    /** O(1) lookup set of favorited product IDs — pass directly to ProductGrid */
    favoriteIdSet,
    totalCount: data?.totalCount ?? 0,
    isLoading,
    isError,
    error,
    refetch,
    isFavorite,
    toggleFavorite,
    isTogglingFavorite,
  };
}
