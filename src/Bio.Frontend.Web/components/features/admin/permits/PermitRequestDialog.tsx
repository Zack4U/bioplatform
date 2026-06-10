"use client";
/**
 * PermitRequestDialog — Entrepreneur submits a genetic-resource access request
 * with full resolution and document details.
 */
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { SpeciesSearchCombobox } from "@/components/features/admin/shared/SpeciesSearchCombobox";
import { useRequestAbsPermit, useUploadPermitDocument } from "@/hooks/features/admin/usePermitsManagement";

const schema = z.object({
    resolutionNumber: z.string().min(1, "Número de resolución requerido"),
    speciesId: z.string().uuid("Seleccione una especie"),
    grantingAuthority: z.string().min(1, "Autoridad otorgante requerida"),
    emissionDate: z.string().min(1, "Fecha de emisión requerida"),
    expirationDate: z.string().min(1, "Fecha de vencimiento requerida"),
    legalFramework: z.string().optional(),
    justification: z.string().max(1000, "Máximo 1000 caracteres").optional(),
    documentUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PermitRequestDialog({ open, onOpenChange }: Props) {
    const requestPermit = useRequestAbsPermit();
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
            justification: "",
            documentUrl: "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        await requestPermit.mutateAsync({
            ...values,
            documentUrl: documentUrl ?? values.documentUrl,
            legalFramework: values.legalFramework || undefined,
            justification: values.justification || undefined,
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
        <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) form.reset(); setDocumentUrl(undefined); }}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Solicitar permiso ABS</DialogTitle>
                    <DialogDescription>
                        Envía una solicitud de acceso a recursos genéticos para una especie, completando todos los datos del permiso obtenido.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="resolutionNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Número de Resolución *</FormLabel>
                                <FormControl><Input placeholder="Ej. RES-2024-001234" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="emissionDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Emisión *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="expirationDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Vencimiento *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="grantingAuthority" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Autoridad Otorgante *</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="legalFramework" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Marco Legal</FormLabel>
                                <FormControl><Input placeholder="Ej. Decreto 1375 de 2013" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="justification" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Justificación</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Describe el propósito del acceso a este recurso genético..."
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <Separator />

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
                            <Button type="submit" disabled={requestPermit.isPending || isUploading}>
                                {requestPermit.isPending ? "Enviando..." : "Enviar solicitud"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
