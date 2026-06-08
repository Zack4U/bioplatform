"use client";
/**
 * useReviewsManagement — Product reviews admin via React Query.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    deleteReviewAdmin,
    getProductReviews,
    getManagedReviews,
    toggleReviewReport,
    deleteManagedReview,
} from "@/services/admin-service";

export function useProductReviews(
    productId: string | null,
    params: { page?: number; pageSize?: number } = {},
) {
    return useQuery({
        queryKey: ["admin", "reviews", productId, params],
        queryFn: () => getProductReviews(productId!, params),
        enabled: !!productId,
        staleTime: 1000 * 60 * 2,
    });
}

export function useDeleteReview(productId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reviewId: string) => deleteReviewAdmin(productId, reviewId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "reviews", productId] });
            toast.success("Reseña eliminada");
        },
        onError: () => toast.error("Error al eliminar la reseña"),
    });
}

// ─── Moderation queue (Admin: all / Entrepreneur: own products) ────────────

export function useManagedReviews(
    params: { isReported?: boolean; page?: number; pageSize?: number } = {},
) {
    return useQuery({
        queryKey: ["admin", "reviews", "manage", params],
        queryFn: () => getManagedReviews(params),
        staleTime: 1000 * 60 * 2,
    });
}

export function useToggleReviewReport() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ reviewId, reason }: { reviewId: string; reason?: string }) =>
            toggleReviewReport(reviewId, reason),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["admin", "reviews", "manage"] });
            toast.success(data.isReported ? "Reseña reportada" : "Reporte retirado");
        },
        onError: () => toast.error("Error al actualizar el reporte"),
    });
}

export function useDeleteManagedReview() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reviewId: string) => deleteManagedReview(reviewId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "reviews", "manage"] });
            toast.success("Reseña eliminada");
        },
        onError: () => toast.error("Error al eliminar la reseña"),
    });
}
