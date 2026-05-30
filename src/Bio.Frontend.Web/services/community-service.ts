/**
 * Community Service — typed API wrappers for posts, comments, and reactions.
 *
 * All functions use the base api helpers from api.ts.
 * Routes are centralized in COMMUNITY_ROUTES.
 *
 * @module services/community-service
 */

import { apiDelete, apiGet, apiGetPaginated, apiPost, apiPut } from "@/services/api";
import { COMMUNITY_ROUTES } from "@/services/routes";
import type {
    CommunityCommentCreateDTO,
    CommunityCommentResponse,
    CommunityCommentUpdateDTO,
    CommunityPostCreateDTO,
    CommunityPostDetail,
    CommunityPostListItem,
    CommunityPostUpdateDTO,
    CommunityReactionResult,
    CommunityReactionToggleDTO,
    PaginatedResponse,
} from "@/types";

// ── Posts ─────────────────────────────────────────────────────────────────────

export interface GetPostsParams {
    category?: string | null;
    status?: string | null;
    page?: number;
    pageSize?: number;
}

export async function getPosts(
    params?: GetPostsParams,
): Promise<PaginatedResponse<CommunityPostListItem>> {
    return apiGetPaginated<CommunityPostListItem>(COMMUNITY_ROUTES.POSTS.BASE, {
        ...(params?.category && { category: params.category }),
        ...(params?.status && { status: params.status }),
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
    });
}

export async function getPostById(id: string): Promise<CommunityPostDetail> {
    return apiGet<CommunityPostDetail>(COMMUNITY_ROUTES.POSTS.BY_ID(id));
}

export async function createPost(dto: CommunityPostCreateDTO): Promise<CommunityPostDetail> {
    return apiPost<CommunityPostCreateDTO, CommunityPostDetail>(
        COMMUNITY_ROUTES.POSTS.BASE,
        dto,
    );
}

export async function updatePost(
    id: string,
    dto: CommunityPostUpdateDTO,
): Promise<CommunityPostDetail> {
    return apiPut<CommunityPostUpdateDTO, CommunityPostDetail>(
        COMMUNITY_ROUTES.POSTS.BY_ID(id),
        dto,
    );
}

export async function deletePost(id: string): Promise<void> {
    await apiDelete<void>(COMMUNITY_ROUTES.POSTS.BY_ID(id));
}

export async function pinPost(id: string): Promise<CommunityPostDetail> {
    return apiPost<object, CommunityPostDetail>(COMMUNITY_ROUTES.POSTS.PIN(id), {});
}

export async function unpinPost(id: string): Promise<CommunityPostDetail> {
    return apiDelete<CommunityPostDetail>(COMMUNITY_ROUTES.POSTS.PIN(id));
}

// ── Comments ─────────────────────────────────────────────────────────────────

export interface GetCommentsParams {
    page?: number;
    pageSize?: number;
}

export async function getComments(
    postId: string,
    params?: GetCommentsParams,
): Promise<PaginatedResponse<CommunityCommentResponse>> {
    return apiGetPaginated<CommunityCommentResponse>(
        COMMUNITY_ROUTES.POSTS.COMMENTS(postId),
        { page: params?.page ?? 1, pageSize: params?.pageSize ?? 20 },
    );
}

export async function createComment(
    postId: string,
    dto: CommunityCommentCreateDTO,
): Promise<CommunityCommentResponse> {
    return apiPost<CommunityCommentCreateDTO, CommunityCommentResponse>(
        COMMUNITY_ROUTES.POSTS.COMMENTS(postId),
        dto,
    );
}

export async function updateComment(
    postId: string,
    commentId: string,
    dto: CommunityCommentUpdateDTO,
): Promise<CommunityCommentResponse> {
    return apiPut<CommunityCommentUpdateDTO, CommunityCommentResponse>(
        COMMUNITY_ROUTES.POSTS.COMMENT_BY_ID(postId, commentId),
        dto,
    );
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
    await apiDelete<void>(COMMUNITY_ROUTES.POSTS.COMMENT_BY_ID(postId, commentId));
}

// ── Reactions ────────────────────────────────────────────────────────────────

export async function toggleReaction(
    dto: CommunityReactionToggleDTO,
): Promise<CommunityReactionResult> {
    return apiPost<CommunityReactionToggleDTO, CommunityReactionResult>(
        COMMUNITY_ROUTES.REACTIONS.TOGGLE,
        dto,
    );
}
