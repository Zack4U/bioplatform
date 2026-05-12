/**
 * useRelatedProducts — fetches products related to a given product.
 * Used in the product detail page sidebar/bottom section.
 *
 * @module hooks/features/marketplace/useRelatedProducts
 */

"use client";

import { getRelatedProducts } from "@/services/marketplace-service";
import type { ProductListItem } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const relatedProductsQueryKey = (productId: string, limit: number) =>
    ["products", "related", productId, limit] as const;

export function useRelatedProducts(productId: string | undefined, limit = 6) {
    return useQuery<ProductListItem[]>({
        queryKey: relatedProductsQueryKey(productId ?? "", limit),
        queryFn: () => getRelatedProducts(productId!, limit),
        enabled: !!productId,
        staleTime: 10 * 60 * 1000, // 10 min — matches backend cache
        gcTime: 30 * 60 * 1000,
    });
}
