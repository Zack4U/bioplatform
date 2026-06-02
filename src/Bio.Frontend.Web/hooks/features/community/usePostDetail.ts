/**
 * usePostDetail — fetches a single post by ID.
 *
 * @module hooks/features/community/usePostDetail
 */

"use client";

import { getPostById } from "@/services/community-service";
import type { CommunityPostDetail } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function usePostDetail(postId: string) {
    const { data: post, isLoading, isError, error } = useQuery<CommunityPostDetail>({
        queryKey: ["community", "post", postId],
        queryFn: () => getPostById(postId),
        enabled: !!postId,
        staleTime: 2 * 60 * 1000,
    });

    return { post, isLoading, isError, error };
}
