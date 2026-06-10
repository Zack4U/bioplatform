"use client";
/**
 * useCertificationsManagement — admin moderation of product certifications.
 *
 * Entrepreneurs request certifications (Status=Pending); Admin / Authority approve or reject.
 * Architecture: Hook Pattern §2.2 — all logic here, the component is UI-only.
 *
 * @module hooks/features/admin/useCertificationsManagement
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getManagedCertifications,
    approveCertification,
    rejectCertification,
} from "@/services/admin-service";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import type { CertificationAdminFilters } from "@/types/admin";

export function useCertificationsList(filters: CertificationAdminFilters = {}) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["admin", "certifications", filters],
        queryFn: () =>
            getManagedCertifications({
                status: filters.status,
                page: filters.page ?? 1,
                pageSize: filters.pageSize ?? ADMIN_PAGE_SIZE,
            }),
        staleTime: 60 * 1000,
    });

    return {
        certifications: data?.items ?? [],
        totalCount: data?.totalCount ?? 0,
        totalPages: data?.totalPages ?? 1,
        isLoading,
        isError,
    };
}

export function useApproveCertification() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => approveCertification(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "certifications"] });
            toast.success("Certificación aprobada.");
        },
        onError: () => toast.error("No se pudo aprobar la certificación."),
    });
}

export function useRejectCertification() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            rejectCertification(id, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "certifications"] });
            toast.success("Certificación rechazada.");
        },
        onError: () => toast.error("No se pudo rechazar la certificación."),
    });
}
