"use client";
/**
 * useSpeciesManagement — Species CRUD via React Query.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    createSpecies, deleteSpecies, getAdminSpecies, getAdminSpeciesById, updateSpecies,
} from "@/services/admin-service";
import type { SpeciesCreatePayload, SpeciesUpdatePayload } from "@/types/admin";

export function useSpeciesList(filters: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: ["admin", "species", filters],
        queryFn: () => getAdminSpecies(filters),
        staleTime: 1000 * 60 * 3,
    });
}

export function useSpeciesById(id: string | null) {
    return useQuery({
        queryKey: ["admin", "species", id],
        queryFn: () => getAdminSpeciesById(id!),
        enabled: !!id,
    });
}

export function useCreateSpecies() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: SpeciesCreatePayload) => createSpecies(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "species"] });
            toast.success("Especie creada exitosamente");
        },
        onError: () => toast.error("Error al crear la especie"),
    });
}

export function useUpdateSpecies() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: SpeciesUpdatePayload }) =>
            updateSpecies(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "species"] });
            toast.success("Especie actualizada");
        },
        onError: () => toast.error("Error al actualizar la especie"),
    });
}

export function useDeleteSpecies() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSpecies(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "species"] });
            toast.success("Especie eliminada");
        },
        onError: () => toast.error("Error al eliminar la especie"),
    });
}
