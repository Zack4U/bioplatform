"use client";
/**
 * SpeciesFormDialog — create or edit a species.
 */
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TAXONOMY_KINGDOMS } from "@/lib/constants";
import type { SpeciesAdminItem } from "@/types";
import { useCreateSpecies, useUpdateSpecies } from "@/hooks/features/admin/useSpeciesManagement";

const CONSERVATION_STATUSES = [
    "LC", "NT", "VU", "EN", "CR", "EW", "EX", "DD", "NE",
];

const schema = z.object({
    scientificName: z.string().min(2, "Mínimo 2 caracteres"),
    commonName: z.string().optional(),
    slug: z.string().min(2, "Mínimo 2 caracteres"),
    kingdom: z.string().optional(),
    phylum: z.string().optional(),
    className: z.string().optional(),
    orderName: z.string().optional(),
    family: z.string().optional(),
    genus: z.string().optional(),
    conservationStatus: z.string().optional(),
    isSensitive: z.boolean(),
    legalStatus: z.boolean(),
    description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    species?: SpeciesAdminItem | null;
}

export function SpeciesFormDialog({ open, onOpenChange, species }: Props) {
    const isEdit = !!species;
    const createSpecies = useCreateSpecies();
    const updateSpecies = useUpdateSpecies();
    const isPending = createSpecies.isPending || updateSpecies.isPending;

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            scientificName: "", commonName: "", slug: "", kingdom: "",
            phylum: "", className: "", orderName: "", family: "", genus: "",
            conservationStatus: "", isSensitive: false, legalStatus: false, description: "",
        },
    });

    useEffect(() => {
        if (open && species) {
            form.reset({
                scientificName: species.scientificName,
                commonName: species.commonName ?? "",
                slug: species.slug,
                kingdom: species.kingdom ?? "",
                family: species.family ?? "",
                conservationStatus: species.conservationStatus ?? "",
                isSensitive: species.isSensitive,
                legalStatus: species.legalStatus,
            });
        } else if (open) {
            form.reset({ isSensitive: false, legalStatus: false });
        }
    }, [open, species, form]);

    const onSubmit = async (values: FormValues) => {
        const payload = {
            ...values,
            commonName: values.commonName || undefined,
            kingdom: values.kingdom || undefined,
            family: values.family || undefined,
            conservationStatus: values.conservationStatus || undefined,
            description: values.description || undefined,
        };
        if (isEdit) {
            await updateSpecies.mutateAsync({ id: species!.id, data: payload });
        } else {
            await createSpecies.mutateAsync(payload as Parameters<typeof createSpecies.mutateAsync>[0]);
        }
        onOpenChange(false);
        form.reset();
    };

    // Auto-generate slug from scientific name
    const watchScientificName = useWatch({ control: form.control, name: "scientificName" });
    useEffect(() => {
        if (!isEdit) {
            form.setValue(
                "slug",
                (watchScientificName ?? "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            );
        }
    }, [watchScientificName, isEdit, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Especie" : "Nueva Especie"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? `Editando: ${species!.scientificName}` : "Registra una nueva especie en el catálogo"}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Basic info */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="scientificName" render={({ field }) => (
                                <FormItem className="col-span-2"><FormLabel>Nombre Científico *</FormLabel>
                                    <FormControl><Input placeholder="Ej. Cinchona pubescens" {...field} className="italic" /></FormControl>
                                    <FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="commonName" render={({ field }) => (
                                <FormItem><FormLabel>Nombre Común</FormLabel>
                                    <FormControl><Input placeholder="Ej. Quina" {...field} /></FormControl>
                                    <FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="slug" render={({ field }) => (
                                <FormItem><FormLabel>Slug</FormLabel>
                                    <FormControl><Input placeholder="cinchona-pubescens" {...field} /></FormControl>
                                    <FormMessage /></FormItem>
                            )} />
                        </div>

                        <Separator />

                        {/* Taxonomy */}
                        <p className="text-sm font-semibold text-muted-foreground">Taxonomía</p>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="kingdom" render={({ field }) => (
                                <FormItem><FormLabel>Reino</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {TAXONOMY_KINGDOMS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="family" render={({ field }) => (
                                <FormItem><FormLabel>Familia</FormLabel>
                                    <FormControl><Input placeholder="Ej. Rubiaceae" {...field} /></FormControl>
                                    <FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="genus" render={({ field }) => (
                                <FormItem><FormLabel>Género</FormLabel>
                                    <FormControl><Input placeholder="Ej. Cinchona" {...field} /></FormControl>
                                    <FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="conservationStatus" render={({ field }) => (
                                <FormItem><FormLabel>Estado de Conservación</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {CONSERVATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage /></FormItem>
                            )} />
                        </div>

                        <Separator />

                        {/* Flags */}
                        <div className="flex gap-8">
                            <FormField control={form.control} name="isSensitive" render={({ field }) => (
                                <FormItem className="flex items-center gap-3">
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <FormLabel className="!mt-0">Especie Sensible</FormLabel>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="legalStatus" render={({ field }) => (
                                <FormItem className="flex items-center gap-3">
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <FormLabel className="!mt-0">Estado Legal</FormLabel>
                                </FormItem>
                            )} />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear especie"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
