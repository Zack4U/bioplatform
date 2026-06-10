/**
 * useMyReviews — paginated hook for the authenticated user's submitted reviews.
 * Used in the "Mis Reseñas" profile tab.
 *
 * @module hooks/features/marketplace/useMyReviews
 */

"use client";

import { getMyReviews, type MyReview } from "@/services/marketplace-service";
import type { PaginatedResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const MY_REVIEWS_QUERY_KEY = ["reviews", "my"] as const;

export function useMyReviews(pageSize = 10) {
    const [page, setPage] = useState(1);

    const query = useQuery<PaginatedResponse<MyReview>>({
        queryKey: [...MY_REVIEWS_QUERY_KEY, page, pageSize],
        queryFn: () => getMyReviews(page, pageSize),
        staleTime: 2 * 60 * 1000, // 2 min — reviews may change after user posts
        placeholderData: (prev) => prev,
    });

    return {
        reviews: query.data?.items ?? [],
        totalCount: query.data?.totalCount ?? 0,
        totalPages: query.data?.totalPages ?? 1,
        page,
        pageSize,
        setPage,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
    };
}
