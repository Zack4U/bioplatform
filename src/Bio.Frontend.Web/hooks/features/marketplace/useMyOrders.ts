/**
 * useMyOrders — paginated React Query hook for the user's order history.
 * Used in the /orders page and the profile "Mis Pedidos" section.
 *
 * @module hooks/features/marketplace/useMyOrders
 */

"use client";

import { getMyOrders, getOrderById } from "@/services/marketplace-service";
import type { Order, PaginatedResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const MY_ORDERS_QUERY_KEY = ["orders", "mine"] as const;

export function useMyOrders(pageSize = 10) {
    const [page, setPage] = useState(1);

    const query = useQuery<PaginatedResponse<Order>>({
        queryKey: [...MY_ORDERS_QUERY_KEY, page, pageSize],
        queryFn: () => getMyOrders(page, pageSize),
        staleTime: 2 * 60 * 1000, // 2 min
        placeholderData: (prev) => prev,
    });

    return {
        orders: query.data?.items ?? [],
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

export function useOrderDetail(orderId: string | null) {
    return useQuery<Order>({
        queryKey: ["orders", orderId],
        queryFn: () => getOrderById(orderId!),
        enabled: !!orderId,
        staleTime: 5 * 60 * 1000,
    });
}
