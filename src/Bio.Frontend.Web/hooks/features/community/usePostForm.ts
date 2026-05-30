/**
 * usePostForm — React Hook Form + Zod for post create/update.
 *
 * Architecture: Hook Pattern §2.2 — all form logic here, PostFormDialog/Page are UI-only.
 *
 * @module hooks/features/community/usePostForm
 */

"use client";

import { createPost, updatePost } from "@/services/community-service";
import type { CommunityPostDetail } from "@/types";
import { notificationService } from "@/lib/notifications";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

const postSchema = z.object({
    title: z
        .string()
        .min(5, "El titulo debe tener al menos 5 caracteres")
        .max(200, "Maximo 200 caracteres"),
    content: z
        .string()
        .min(10, "El contenido debe tener al menos 10 caracteres"),
    category: z.string().optional().nullable(),
});

export type PostFormValues = z.infer<typeof postSchema>;

interface UsePostFormOptions {
    postId?: string;
    defaultValues?: Partial<PostFormValues>;
    onSuccess?: (post: CommunityPostDetail) => void;
}

export function usePostForm({ postId, defaultValues, onSuccess }: UsePostFormOptions = {}) {
    const queryClient = useQueryClient();
    const isEditing = !!postId;

    const form = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: defaultValues?.title ?? "",
            content: defaultValues?.content ?? "",
            category: defaultValues?.category ?? null,
        },
    });

    const { mutate, isPending, isSuccess } = useMutation<
        CommunityPostDetail,
        Error,
        PostFormValues
    >({
        mutationFn: (values) => {
            if (isEditing) {
                return updatePost(postId!, {
                    title: values.title,
                    content: values.content,
                    category: values.category ?? null,
                });
            }
            return createPost({
                title: values.title,
                content: values.content,
                category: values.category ?? null,
            });
        },
        onSuccess: (post) => {
            queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
            if (isEditing) {
                queryClient.invalidateQueries({ queryKey: ["community", "post", postId] });
            }
            notificationService.success(
                isEditing ? "Post actualizado correctamente." : "Post publicado correctamente.",
            );
            form.reset();
            onSuccess?.(post);
        },
        onError: () => {
            notificationService.error("No se pudo guardar el post. Intenta de nuevo.");
        },
    });

    function onSubmit(values: PostFormValues) {
        mutate(values);
    }

    return { form, onSubmit, isPending, isSuccess, isEditing };
}
