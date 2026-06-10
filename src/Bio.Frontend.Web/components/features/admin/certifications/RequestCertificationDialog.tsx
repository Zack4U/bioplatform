"use client";
/**
 * RequestCertificationDialog — entrepreneur requests a new product certification
 * (Status = "Pending").
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getMyProducts } from "@/services/marketplace-service";
import { useRequestCertification } from "@/hooks/features/admin/useCertificationsManagement";
import { useUploadPermitDocument } from "@/hooks/features/admin/usePermitsManagement";

const schema = z.object({
    productId: z.string().uuid("Seleccione un producto"),
    name: z.string().min(1, "Nombre requerido"),
    certificationType: z.enum(["Sustainability", "Organic", "Quality", "FairTrade", "ABS"], {
        message: "Seleccione un tipo de certificación",
    }),
    issuingBody: z.string().min(1, "Organismo emisor requerido"),
    certificateNumber: z.string().optional(),
    issuedAt: z.string().min(1, "Fecha de emisión requerida"),
    expiresAt: z.string().optional(),
    verificationCode: z.string().optional(),
    documentUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RequestCertificationDialog({ open, onOpenChange }: Props) {
    const requestCert = useRequestCertification();
    const { mutateAsync: uploadDoc, uploadProgress, isPending: isUploading } = useUploadPermitDocument();
    const [documentUrl, setDocumentUrl] = useState<string | undefined>();

    // Fetch the entrepreneur's products
    const { data: productsData, isLoading: isLoadingProducts } = useQuery({
        queryKey: ["products", "my-list"],
        queryFn: () => getMyProducts({ pageSize: 100 }),
        enabled: open,
    });

    const products = productsData?.items ?? [];

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            productId: "",
            name: "",
            certificationType: "Sustainability",
            issuingBody: "",
            certificateNumber: "",
            issuedAt: "",
            expiresAt: "",
            verificationCode: "",
            documentUrl: "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        await requestCert.mutateAsync({
            productId: values.productId,
            data: {
                name: values.name,
                certificationType: values.certificationType,
                issuingBody: values.issuingBody,
                certificateNumber: values.certificateNumber || undefined,
                issuedAt: values.issuedAt,
                expiresAt: values.expiresAt || undefined,
                verificationCode: values.verificationCode || undefined,
                documentUrl: (documentUrl ?? values.documentUrl) || undefined,
            },
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
                    <DialogTitle>Solicitar Certificación de Producto</DialogTitle>
                    <DialogDescription>
                        Registra una certificación de sostenibilidad, orgánica o de calidad para uno de tus productos.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="productId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Producto *</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange} disabled={isLoadingProducts}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingProducts ? "Cargando tus productos..." : "Seleccione un producto"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {products.map((prod) => (
                                            <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre de la Certificación *</FormLabel>
                                <FormControl><Input placeholder="Ej. Certificado Orgánico USDA, Sello FairTrade" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="certificationType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo *</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Sustainability">Sostenibilidad</SelectItem>
                                            <SelectItem value="Organic">Orgánico</SelectItem>
                                            <SelectItem value="Quality">Calidad</SelectItem>
                                            <SelectItem value="FairTrade">Comercio Justo</SelectItem>
                                            <SelectItem value="ABS">Cumplimiento ABS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="issuingBody" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ente Emisor *</FormLabel>
                                    <FormControl><Input placeholder="Ej. Ecocert, Kiwa, MinAmbiente" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="certificateNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de Certificado</FormLabel>
                                    <FormControl><Input placeholder="Ej. CERT-98765" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="verificationCode" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código de Verificación</FormLabel>
                                    <FormControl><Input placeholder="Ej. V-XYZ-123" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="issuedAt" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Emisión *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="expiresAt" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Expiración</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <Separator />

                        <div>
                            <p className="text-sm font-medium mb-1">Documento PDF del Certificado (opcional)</p>
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
                            <Button type="submit" disabled={requestCert.isPending || isUploading}>
                                {requestCert.isPending ? "Enviando..." : "Enviar solicitud"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
