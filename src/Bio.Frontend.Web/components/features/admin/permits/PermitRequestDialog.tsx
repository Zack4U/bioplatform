"use client";
/**
 * PermitRequestDialog — Entrepreneur submits a genetic-resource access request
 * (Status = "Pending"). Official resolution data is filled in by the authority on approval.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SpeciesSearchCombobox } from "@/components/features/admin/shared/SpeciesSearchCombobox";
import { useRequestAbsPermit } from "@/hooks/features/admin/usePermitsManagement";

const schema = z.object({
    speciesId: z.string().uuid("Seleccione una especie"),
    justification: z.string().max(1000, "Máximo 1000 caracteres").optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PermitRequestDialog({ open, onOpenChange }: Props) {
    const requestPermit = useRequestAbsPermit();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { speciesId: "", justification: "" },
    });

    const onSubmit = async (values: FormValues) => {
        await requestPermit.mutateAsync({
            speciesId: values.speciesId,
            justification: values.justification || undefined,
        });
        onOpenChange(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) form.reset(); }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Solicitar permiso ABS</DialogTitle>
                    <DialogDescription>
                        Envía una solicitud de acceso a recursos genéticos para una especie. Una autoridad
                        ambiental revisará la solicitud y asignará la resolución oficial.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                        <FormField control={form.control} name="justification" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Justificación</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Describe el propósito del acceso a este recurso genético..."
                                        rows={4}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={requestPermit.isPending}>
                                {requestPermit.isPending ? "Enviando..." : "Enviar solicitud"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
