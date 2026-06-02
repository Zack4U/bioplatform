/**
 * Networking Service — typed API wrappers for user connections.
 *
 * @module services/networking-service
 */

import { apiDelete, apiGetPaginated, apiPost, apiPut } from "@/services/api";
import { COMMUNITY_ROUTES } from "@/services/routes";
import type {
    PaginatedResponse,
    UserConnectionRequestDTO,
    UserConnectionRespondDTO,
    UserConnectionResponse,
} from "@/types";

export interface GetConnectionsParams {
    status?: string | null;
    page?: number;
    pageSize?: number;
}

export async function getMyConnections(
    params?: GetConnectionsParams,
): Promise<PaginatedResponse<UserConnectionResponse>> {
    return apiGetPaginated<UserConnectionResponse>(
        COMMUNITY_ROUTES.NETWORKING.CONNECTIONS,
        {
            ...(params?.status && { status: params.status }),
            page: params?.page ?? 1,
            pageSize: params?.pageSize ?? 20,
        },
    );
}

export async function getPendingRequests(
    params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<UserConnectionResponse>> {
    return apiGetPaginated<UserConnectionResponse>(
        COMMUNITY_ROUTES.NETWORKING.PENDING,
        { page: params?.page ?? 1, pageSize: params?.pageSize ?? 20 },
    );
}

export async function sendConnectionRequest(
    dto: UserConnectionRequestDTO,
): Promise<UserConnectionResponse> {
    return apiPost<UserConnectionRequestDTO, UserConnectionResponse>(
        COMMUNITY_ROUTES.NETWORKING.CONNECTIONS,
        dto,
    );
}

export async function respondToRequest(
    connectionId: string,
    dto: UserConnectionRespondDTO,
): Promise<UserConnectionResponse> {
    return apiPut<UserConnectionRespondDTO, UserConnectionResponse>(
        COMMUNITY_ROUTES.NETWORKING.RESPOND(connectionId),
        dto,
    );
}

export async function deleteConnection(connectionId: string): Promise<void> {
    await apiDelete<void>(COMMUNITY_ROUTES.NETWORKING.BY_ID(connectionId));
}
