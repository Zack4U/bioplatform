"use client";
/**
 * ApprovePermitDialog — Admin/Authority approves a Pending ABS permit request,
 * filling in the official resolution data that activates the permit.
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
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useApproveAbsPermit, useUploadPermitDocument } from "@/hooks/features/admin/usePermitsManagement";
import type { PermitAdminItem } from "@/types/admin";

const schema = z.object({
    resolutionNumber: z.string().min(1, "Requerido"),
    grantingAuthority: z.string().min(1, "Requerido"),
    emissionDate: z.string().min(1, "Requerido"),
    expirationDate: z.string().min(1, "Requerido"),
    legalFramework: z.string().optional(),
    documentUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    permit: PermitAdminItem | null;
    onOpenChange: (open: boolean) => void;
}

export function ApprovePermitDialog({ permit, onOpenChange }: Props) {
    const approve = useApproveAbsPermit();
    const { mutateAsync: uploadDoc, uploadProgress, isPending: isUploading } = useUploadPermitDocument();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            resolutionNumber: "",
            grantingAuthority: "Ministerio de Ambiente y Desarrollo Sostenible",
            emissionDate: "",
            expirationDate: "",
            legalFramework: "Decreto 1375 de 2013",
            documentUrl: "",
        },
    });

    // Derived from the form field — no separate state to sync.
    const documentUrl = useWatch({ control: form.control, name: "documentUrl" });

    useEffect(() => {
        if (permit) {
            form.reset({
                resolutionNumber: "",
                grantingAuthority: "Ministerio de Ambiente y Desarrollo Sostenible",
                emissionDate: "",
                expirationDate: "",
                legalFramework: "Decreto 1375 de 2013",
                documentUrl: "",
            });
        }
    }, [permit, form]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const result = await uploadDoc(file);
        form.setValue("documentUrl", result.documentUrl);
    };

    const onSubmit = async (values: FormValues) => {
        if (!permit) return;
        await approve.mutateAsync({
            id: permit.id,
            data: {
                resolutionNumber: values.resolutionNumber,
                grantingAuthority: values.grantingAuthority,
                emissionDate: values.emissionDate,
                expirationDate: values.expirationDate,
                legalFramework: values.legalFramework || undefined,
                documentUrl: values.documentUrl || undefined,
            },
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={!!permit} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Aprobar solicitud de permiso ABS</DialogTitle>
                    <DialogDescription>
                        Asigna los datos oficiales de la resolución para activar el permiso de{" "}
                        <span className="font-medium">{permit?.entrepreneurName}</span>.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="resolutionNumber" render={({ field }) => (
                            <FormItem><FormLabel>Número de Resolución *</FormLabel>
                                <FormControl><Input placeholder="Ej. RES-2024-001234" {...field} /></FormControl>
                                <FormMessage /></FormItem>
                        )} />

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
                                <p className="text-xs text-success mt-1">PDF cargado correctamente</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={approve.isPending || isUploading}>
                                {approve.isPending ? "Aprobando..." : "Aprobar y activar"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
