"use client";
/**
 * PermitFormDialog — create a new ABS permit with species search.
 */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Separator } from "@/components/ui/separator";
import { SpeciesSearchCombobox } from "@/components/features/admin/shared/SpeciesSearchCombobox";
import { UserSearchCombobox } from "@/components/features/admin/shared/UserSearchCombobox";
import { useCreatePermit, useUploadPermitDocument } from "@/hooks/features/admin/usePermitsManagement";
import { Progress } from "@/components/ui/progress";

const schema = z.object({
    resolutionNumber: z.string().min(1, "Requerido"),
    speciesId: z.string().uuid("Seleccione una especie"),
    grantingAuthority: z.string().min(1, "Requerido"),
    emissionDate: z.string().min(1, "Requerido"),
    expirationDate: z.string().min(1, "Requerido"),
    legalFramework: z.string().optional(),
    entrepreneurId: z.string().uuid("ID de emprendedor requerido"),
    documentUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entrepreneurId?: string;
}

export function PermitFormDialog({ open, onOpenChange, entrepreneurId }: Props) {
    const createPermit = useCreatePermit();
    const { mutateAsync: uploadDoc, uploadProgress, isPending: isUploading } = useUploadPermitDocument();
    const [documentUrl, setDocumentUrl] = useState<string | undefined>();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            resolutionNumber: "",
            speciesId: "",
            grantingAuthority: "Ministerio de Ambiente y Desarrollo Sostenible",
            emissionDate: "",
            expirationDate: "",
            legalFramework: "Decreto 1375 de 2013",
            entrepreneurId: entrepreneurId ?? "",
            documentUrl: "",
        },
    });

    useEffect(() => {
        if (entrepreneurId) {
            form.setValue("entrepreneurId", entrepreneurId);
        }
    }, [entrepreneurId, form]);

    const onSubmit = async (values: FormValues) => {
        await createPermit.mutateAsync({
            ...values,
            documentUrl: documentUrl ?? values.documentUrl,
            legalFramework: values.legalFramework || undefined,
        });
        onOpenChange(false);
        form.reset();
        setDocumentUrl(undefined);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const result = await uploadDoc(file);
        setDocumentUrl(result.documentUrl);
        form.setValue("documentUrl", result.documentUrl);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nuevo Permiso ABS</DialogTitle>
                    <DialogDescription>Registra un permiso de acceso a recursos genéticos</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="resolutionNumber" render={({ field }) => (
                            <FormItem><FormLabel>Número de Resolución *</FormLabel>
                                <FormControl><Input placeholder="Ej. RES-2024-001234" {...field} /></FormControl>
                                <FormMessage /></FormItem>
                        )} />

                        {/* Species search */}
                        <FormField control={form.control} name="speciesId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Especie *</FormLabel>
                                <SpeciesSearchCombobox
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Buscar especie..."
                                />
                                <FormMessage />
                            </FormItem>
                        )} />

                        {!entrepreneurId && (
                            <FormField control={form.control} name="entrepreneurId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Emprendedor *</FormLabel>
                                    <UserSearchCombobox
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Buscar emprendedor..."
                                        roleName="Entrepreneur"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="emissionDate" render={({ field }) => (
                                <FormItem><FormLabel>Fecha de Emisión *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="expirationDate" render={({ field }) => (
                                <FormItem><FormLabel>Fecha de Vencimiento *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage /></FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="grantingAuthority" render={({ field }) => (
                            <FormItem><FormLabel>Autoridad Otorgante *</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage /></FormItem>
                        )} />

                        <FormField control={form.control} name="legalFramework" render={({ field }) => (
                            <FormItem><FormLabel>Marco Legal</FormLabel>
                                <FormControl><Input placeholder="Ej. Decreto 1375 de 2013" {...field} /></FormControl>
                                <FormMessage /></FormItem>
                        )} />

                        <Separator />

                        {/* PDF Upload */}
                        <div>
                            <p className="text-sm font-medium mb-1">Documento PDF (opcional)</p>
                            <input
                                type="file"
                                accept="application/pdf"
                                disabled={isUploading}
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent cursor-pointer"
                            />
                            {isUploading && <Progress value={uploadProgress} className="mt-2 h-2" />}
                            {documentUrl && !isUploading && (
                                <p className="text-xs text-success mt-1">✓ PDF cargado correctamente</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createPermit.isPending || isUploading}>
                                {createPermit.isPending ? "Creando..." : "Crear Permiso"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
