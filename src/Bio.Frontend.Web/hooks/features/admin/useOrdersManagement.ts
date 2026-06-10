"use client";
/**
 * useOrdersManagement — Orders list + status change via React Query.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminOrders, getAdminOrderById, updateOrderStatus } from "@/services/admin-service";
import type { OrderAdminFilters } from "@/types/admin";

export function useOrdersList(filters: OrderAdminFilters = {}) {
    return useQuery({
        queryKey: ["admin", "orders", filters],
        queryFn: () => getAdminOrders(filters),
        staleTime: 1000 * 60 * 2,
    });
}

export function useOrderById(id: string | null) {
    return useQuery({
        queryKey: ["admin", "orders", id],
        queryFn: () => getAdminOrderById(id!),
        enabled: !!id,
    });
}

export function useUpdateOrderStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            updateOrderStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "orders"] });
            toast.success("Estado de orden actualizado");
        },
        onError: () => toast.error("Error al actualizar el estado"),
    });
}
