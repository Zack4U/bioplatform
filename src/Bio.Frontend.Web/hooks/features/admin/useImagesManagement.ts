"use client";
/**
 * useImagesManagement — Species images with validate/reject via React Query.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getSpeciesImages, validateSpeciesImage, rejectSpeciesImage,
} from "@/services/admin-service";

export function useSpeciesImagesList(
    speciesId: string | null,
    params: { onlyValidatedByExpert?: boolean; page?: number; pageSize?: number } = {},
) {
    return useQuery({
        queryKey: ["admin", "images", speciesId, params],
        queryFn: () => getSpeciesImages(speciesId!, params),
        enabled: !!speciesId,
        staleTime: 1000 * 60 * 2,
    });
}

export function useValidateImage(speciesId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (imageId: string) => validateSpeciesImage(speciesId, imageId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "images", speciesId] });
            toast.success("Imagen validada por experto");
        },
        onError: () => toast.error("Error al validar la imagen"),
    });
}

export function useRejectImage(speciesId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (imageId: string) => rejectSpeciesImage(speciesId, imageId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "images", speciesId] });
            toast.success("Imagen rechazada");
        },
        onError: () => toast.error("Error al rechazar la imagen"),
    });
}
