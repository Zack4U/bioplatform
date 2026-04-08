/**
 * useProductDetail — React Query hook for the product detail page.
 *
 * Fetches full product detail by slug from marketplace-service.
 * Mirrors useSpeciesDetail pattern.
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *
 * @module hooks/features/marketplace/useProductDetail
 */

"use client";

import { getProductBySlug } from "@/services/marketplace-service";
import type { ProductDetailDTO } from "@/types/marketplace";
import { useQuery } from "@tanstack/react-query";

export function useProductDetail(slug: string) {
    const { data, isLoading, isError, error, refetch } =
        useQuery<ProductDetailDTO | null>({
            queryKey: ["marketplace", "product", slug],
            queryFn: () => getProductBySlug(slug),
            enabled: !!slug,
            staleTime: 10 * 60 * 1000,
            gcTime: 15 * 60 * 1000,
            retry: 2,
        });

    return {
        product: data ?? null,
        isLoading,
        isError,
        error,
        refetch,
    };
}
