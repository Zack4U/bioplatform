"use client";
/**
 * usePermitsManagement — ABS Permits CRUD + PDF upload via React Query.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
    createPermit, getAdminPermits, getPermitById, getPermitsByEntrepreneur,
    revokePermit, updatePermit, uploadPermitDocument,
    requestAbsPermit, cancelAbsPermitRequest, approveAbsPermit, rejectAbsPermit,
} from "@/services/admin-service";
import type {
    PermitCreatePayload, PermitUpdatePayload,
    AbsPermitRequestPayload, ApproveAbsPermitPayload, RejectAbsPermitPayload,
} from "@/types/admin";

export function usePermitsList(params: {
    entrepreneurId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    enabled?: boolean;
} = {}) {
    const { enabled = true, ...queryParams } = params;
    return useQuery({
        queryKey: ["admin", "permits", queryParams],
        queryFn: () => getAdminPermits(queryParams),
        staleTime: 1000 * 60 * 3,
        enabled,
    });
}

export function useEntrepreneurPermitsList(userId: string) {
    return useQuery({
        queryKey: ["admin", "permits", "entrepreneur", userId],
        queryFn: () => getPermitsByEntrepreneur(userId),
        enabled: !!userId,
        staleTime: 1000 * 60 * 3,
    });
}

export function usePermitById(id: string | null) {
    return useQuery({
        queryKey: ["admin", "permits", id],
        queryFn: () => getPermitById(id!),
        enabled: !!id,
    });
}

export function useCreatePermit() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: PermitCreatePayload) => createPermit(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "permits"] });
            toast.success("Permiso ABS creado exitosamente");
        },
        onError: () => toast.error("Error al crear el permiso ABS"),
    });
}

export function useUpdatePermit() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: PermitUpdatePayload }) =>
            updatePermit(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "permits"] });
            toast.success("Permiso ABS actualizado");
        },
        onError: () => toast.error("Error al actualizar el permiso"),
    });
}

export function useRevokePermit() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => revokePermit(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "permits"] });
            toast.success("Permiso ABS revocado");
        },
        onError: () => toast.error("Error al revocar el permiso"),
    });
}

export function useRequestAbsPermit() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: AbsPermitRequestPayload) => requestAbsPermit(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "permits"] });
            toast.success("Solicitud de permiso ABS enviada");
        },
        onError: () => toast.error("Error al enviar la solicitud de permiso"),
    });
}

export function useCancelAbsPermitRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => cancelAbsPermitRequest(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "permits"] });
            toast.success("Solicitud de permiso cancelada");
        },
        onError: () => toast.error("Error al cancelar la solicitud"),
    });
}

export function useApproveAbsPermit() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ApproveAbsPermitPayload }) =>
            approveAbsPermit(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "permits"] });
            toast.success("Permiso ABS aprobado y activado");
        },
        onError: () => toast.error("Error al aprobar la solicitud"),
    });
}

export function useRejectAbsPermit() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: RejectAbsPermitPayload }) =>
            rejectAbsPermit(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "permits"] });
            toast.success("Solicitud de permiso rechazada");
        },
        onError: () => toast.error("Error al rechazar la solicitud"),
    });
}

/** Hook for PDF document upload with progress tracking */
export function useUploadPermitDocument() {
    const [uploadProgress, setUploadProgress] = useState(0);
    const mutation = useMutation({
        mutationFn: (file: File) =>
            uploadPermitDocument(file, setUploadProgress),
        onSuccess: () => {
            setUploadProgress(0);
            toast.success("Documento PDF subido exitosamente");
        },
        onError: () => {
            setUploadProgress(0);
            toast.error("Error al subir el documento PDF");
        },
    });
    return { ...mutation, uploadProgress };
}
