/**
 * useCommunityFeed — paginated community post feed with category filtering.
 *
 * Architecture: Hook Pattern §2.2 — all logic here, PostFeed.tsx is UI-only.
 *
 * @module hooks/features/community/useCommunityFeed
 */

"use client";

import { getPosts } from "@/services/community-service";
import { COMMUNITY_PAGE_SIZE } from "@/lib/constants";
import type { CommunityPostListItem, PaginatedResponse } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function useCommunityFeed() {
    const queryClient = useQueryClient();
    const [category, setCategory] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, error, isFetching } = useQuery<
        PaginatedResponse<CommunityPostListItem>
    >({
        queryKey: ["community", "posts", category, page],
        queryFn: () =>
            getPosts({ category, status: "Published", page, pageSize: COMMUNITY_PAGE_SIZE }),
        staleTime: 2 * 60 * 1000,
        placeholderData: (prev) => prev,
    });

    const posts = data?.items ?? [];
    const totalPages = data?.totalPages ?? 1;
    const hasNextPage = data?.hasNextPage ?? false;
    const hasPreviousPage = data?.hasPreviousPage ?? false;

    function handleCategoryChange(newCategory: string | null) {
        setCategory(newCategory);
        setPage(1);
    }

    function handlePageChange(newPage: number) {
        setPage(newPage);
    }

    function invalidateFeed() {
        queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
    }

    return {
        posts,
        category,
        page,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        isLoading,
        isError,
        isFetching,
        error,
        handleCategoryChange,
        handlePageChange,
        invalidateFeed,
    };
}
