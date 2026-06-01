"use client";

/**
 * Post create page — mobile-only full page form for creating posts.
 * Desktop uses PostFormDialog instead.
 *
 * @module app/community/posts/create/page
 */

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
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreatePostPage() {
    const router = useRouter();

    const { form, onSubmit, isPending } = usePostForm({
        onSuccess: () => router.push("/community"),
    });

    const {
        register,
        setValue,
        watch,
        handleSubmit,
        formState: { errors },
    } = form;

    return (
        <div className="flex flex-col min-h-[calc(100dvh-4rem)]">
            {/* Mobile header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-16 bg-background z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    aria-label="Volver"
                >
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </Button>
                <h1 className="font-semibold text-base flex-1">Nueva publicacion</h1>
                <Button
                    form="create-post-form"
                    type="submit"
                    size="sm"
                    disabled={isPending}
                    id="post-publish-btn"
                >
                    {isPending ? "Publicando..." : "Publicar"}
                </Button>
            </div>

            <form
                id="create-post-form"
                onSubmit={handleSubmit(onSubmit)}
                className="flex-1 p-4 space-y-4"
            >
                <div className="space-y-1.5">
                    <Label htmlFor="post-title-mobile">Titulo</Label>
                    <Input
                        id="post-title-mobile"
                        placeholder="Escribe un titulo..."
                        {...register("title")}
                        aria-invalid={!!errors.title}
                    />
                    {errors.title && (
                        <p className="text-xs text-destructive">{errors.title.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="post-category-mobile">Categoria</Label>
                    <Select
                        value={watch("category") ?? ""}
                        onValueChange={(val) =>
                            setValue("category", val || null, { shouldValidate: true })
                        }
                    >
                        <SelectTrigger id="post-category-mobile">
                            <SelectValue placeholder="Selecciona..." />
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

                <div className="space-y-1.5">
                    <Label>Contenido</Label>
                    <RichTextEditor
                        value={watch("content")}
                        onChange={(val) =>
                            setValue("content", val, { shouldValidate: true })
                        }
                        placeholder="Comparte algo con la comunidad..."
                        className="min-h-[300px]"
                    />
                    {errors.content && (
                        <p className="text-xs text-destructive">{errors.content.message}</p>
                    )}
                </div>
            </form>
        </div>
    );
}
