"use client";

/**
 * PostFormDialog — dialog form to create/edit a post (desktop).
 * Mobile uses PostFormPage (/community/posts/create).
 *
 * @module components/features/community/PostFormDialog
 */

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import { usePostForm } from "@/hooks/features/community";
import { POST_CATEGORIES } from "@/lib/constants";
import type { CommunityPostListItem } from "@/types";

interface PostFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editPost?: CommunityPostListItem | null;
}

export function PostFormDialog({ open, onOpenChange, editPost }: PostFormDialogProps) {
    const { form, onSubmit, isPending, isEditing } = usePostForm({
        postId: editPost?.id,
        defaultValues: editPost
            ? {
                  title: editPost.title,
                  content: editPost.content || "",
                  category: editPost.category,
              }
            : undefined,
        onSuccess: () => onOpenChange(false),
    });

    const {
        register,
        setValue,
        watch,
        handleSubmit,
        formState: { errors },
    } = form;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar publicacion" : "Nueva publicacion"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="post-title">Titulo</Label>
                        <Input
                            id="post-title"
                            placeholder="Escribe un titulo..."
                            {...register("title")}
                            aria-invalid={!!errors.title}
                        />
                        {errors.title && (
                            <p className="text-xs text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                        <Label htmlFor="post-category">Categoria</Label>
                        <Select
                            value={watch("category") ?? ""}
                            onValueChange={(val) =>
                                setValue("category", val || null, { shouldValidate: true })
                            }
                        >
                            <SelectTrigger id="post-category">
                                <SelectValue placeholder="Selecciona una categoria..." />
                            </SelectTrigger>
                            <SelectContent>
                                {POST_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                        <Label>Contenido</Label>
                        <RichTextEditor
                            value={watch("content")}
                            onChange={(val) =>
                                setValue("content", val, { shouldValidate: true })
                            }
                            placeholder="Comparte algo con la comunidad..."
                            minHeight={180}
                        />
                        {errors.content && (
                            <p className="text-xs text-destructive">{errors.content.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending} id="post-submit-btn">
                            {isPending
                                ? "Publicando..."
                                : isEditing
                                  ? "Guardar cambios"
                                  : "Publicar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
