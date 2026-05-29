/**
 * AddressFormPanel — unified responsive address create/edit overlay.
 *
 * Desktop (md+) → Sheet sliding from the right (sm:max-w-md).
 * Mobile        → Drawer from the bottom (vaul).
 *
 * Uses useIsMd() from the global useMediaQuery hook for uniform
 * breakpoint detection. This component is used in BOTH contexts:
 *   - Checkout (CheckoutAddressStep)
 *   - Profile  (AddressBook)
 *
 * Features:
 *  - React Hook Form + Zod validation
 *  - Pre-fills fields when editing an existing address
 *  - Colombian phone validation (+57 / 3xx format)
 *  - Full list of Colombian departments in a Select
 *  - isDefault checkbox
 *  - WCAG 2.1 AA accessible labels & error messages
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *
 * @module components/features/marketplace/checkout/AddressFormPanel
 */

"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useIsMd } from "@/hooks/useMediaQuery";
import type { Address, CreateAddressRequest } from "@/types/marketplace";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

// ─── Colombian departments ────────────────────────────────────────────────────

const COLOMBIAN_DEPARTMENTS = [
    "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá",
    "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba",
    "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena",
    "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda",
    "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca",
    "Vaupés", "Vichada",
] as const;

// ─── Zod schema ───────────────────────────────────────────────────────────────

const colombianPhoneRegex = /^(\+57\s?)?3\d{9}$/;

const addressFormSchema = z.object({
    label: z.string().min(1, "El nombre de la dirección es requerido.").max(50, "Máximo 50 caracteres."),
    fullName: z.string().min(3, "El nombre completo debe tener al menos 3 caracteres.").max(100, "Máximo 100 caracteres."),
    phone: z.string().min(1, "El teléfono es requerido.").regex(colombianPhoneRegex, "Ingresa un número colombiano válido (ej: 3001234567 o +573001234567)."),
    addressLine1: z.string().min(5, "La dirección debe tener al menos 5 caracteres.").max(200, "Máximo 200 caracteres."),
    addressLine2: z.string().max(200, "Máximo 200 caracteres.").optional(),
    city: z.string().min(2, "La ciudad es requerida.").max(100, "Máximo 100 caracteres."),
    department: z.string().min(1, "Selecciona un departamento."),
    postalCode: z.string().max(10, "Máximo 10 caracteres.").optional(),
    country: z.string().min(1),
    isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AddressFormPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAddressRequest) => void;
    isSubmitting: boolean;
    editingAddress?: Address | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toFormValues(address: Address): AddressFormValues {
    return {
        label: address.addressType,
        fullName: address.recipientName,
        phone: address.phoneNumber ?? "",
        addressLine1: address.streetLine1,
        addressLine2: address.streetLine2 ?? "",
        city: address.city,
        department: address.department,
        postalCode: address.postalCode ?? "",
        country: address.country,
        isDefault: address.isDefault,
    };
}

const DEFAULT_FORM_VALUES: AddressFormValues = {
    label: "", fullName: "", phone: "", addressLine1: "", addressLine2: "",
    city: "", department: "", postalCode: "", country: "Colombia", isDefault: false,
};

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p role="alert" className="text-xs text-destructive mt-1">{message}</p>;
}

// ─── Shared form body ─────────────────────────────────────────────────────────

function AddressFormBody({
    formId,
    register,
    control,
    errors,
}: {
    formId: string;
    register: ReturnType<typeof useForm<AddressFormValues>>["register"];
    control: ReturnType<typeof useForm<AddressFormValues>>["control"];
    errors: ReturnType<typeof useForm<AddressFormValues>>["formState"]["errors"];
}) {
    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" id={formId + "-fields"}>
            {/* Label */}
            <div className="space-y-1.5">
                <Label htmlFor="addr-label">
                    Nombre de la dirección <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input id="addr-label" placeholder="Ej: Casa, Trabajo..." autoComplete="off"
                    aria-invalid={!!errors.label} {...register("label")} />
                <FieldError message={errors.label?.message} />
            </div>

            {/* Full name */}
            <div className="space-y-1.5">
                <Label htmlFor="addr-fullname">
                    Nombre del destinatario <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input id="addr-fullname" placeholder="Nombre y apellidos" autoComplete="name"
                    aria-invalid={!!errors.fullName} {...register("fullName")} />
                <FieldError message={errors.fullName?.message} />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
                <Label htmlFor="addr-phone">
                    Teléfono <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input id="addr-phone" type="tel" placeholder="3001234567 o +573001234567"
                    autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
                <FieldError message={errors.phone?.message} />
            </div>

            <Separator />

            {/* Address line 1 */}
            <div className="space-y-1.5">
                <Label htmlFor="addr-line1">
                    Dirección <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input id="addr-line1" placeholder="Calle, carrera, número..." autoComplete="address-line1"
                    aria-invalid={!!errors.addressLine1} {...register("addressLine1")} />
                <FieldError message={errors.addressLine1?.message} />
            </div>

            {/* Address line 2 */}
            <div className="space-y-1.5">
                <Label htmlFor="addr-line2">
                    Complemento <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <Input id="addr-line2" placeholder="Apartamento, barrio, referencia..."
                    autoComplete="address-line2" {...register("addressLine2")} />
                <FieldError message={errors.addressLine2?.message} />
            </div>

            {/* City + Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="addr-city">
                        Ciudad <span aria-hidden="true" className="text-destructive">*</span>
                    </Label>
                    <Input id="addr-city" placeholder="Ej: Manizales" autoComplete="address-level2"
                        aria-invalid={!!errors.city} {...register("city")} />
                    <FieldError message={errors.city?.message} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="addr-department">
                        Departamento <span aria-hidden="true" className="text-destructive">*</span>
                    </Label>
                    <Controller name="department" control={control} render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="addr-department" aria-invalid={!!errors.department} className="w-full">
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {COLOMBIAN_DEPARTMENTS.map((dept) => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )} />
                    <FieldError message={errors.department?.message} />
                </div>
            </div>

            {/* Postal code */}
            <div className="space-y-1.5">
                <Label htmlFor="addr-postal">
                    Código postal <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <Input id="addr-postal" placeholder="Ej: 170001" autoComplete="postal-code"
                    maxLength={10} {...register("postalCode")} />
                <FieldError message={errors.postalCode?.message} />
            </div>

            <Separator />

            {/* Is default */}
            <div className="flex items-center gap-3">
                <Controller name="isDefault" control={control} render={({ field }) => (
                    <Checkbox id="addr-default" checked={field.value} onCheckedChange={field.onChange}
                        aria-label="Establecer como dirección predeterminada" />
                )} />
                <Label htmlFor="addr-default" className="text-sm cursor-pointer leading-snug">
                    Establecer como dirección predeterminada
                </Label>
            </div>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddressFormPanel({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    editingAddress,
}: AddressFormPanelProps) {
    const isDesktop = useIsMd();
    const isEditing = !!editingAddress;

    const { register, handleSubmit, control, reset, formState: { errors } } =
        useForm<AddressFormValues>({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            resolver: zodResolver(addressFormSchema) as any,
            defaultValues: DEFAULT_FORM_VALUES,
        });

    useEffect(() => {
        if (isOpen) reset(isEditing ? toFormValues(editingAddress!) : DEFAULT_FORM_VALUES);
    }, [isOpen, isEditing, editingAddress, reset]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFormSubmit = (values: any) => {
        onSubmit({
            addressType: values.label,
            recipientName: values.fullName,
            phoneNumber: values.phone,
            streetLine1: values.addressLine1,
            streetLine2: values.addressLine2 || undefined,
            city: values.city,
            department: values.department,
            postalCode: String(values.postalCode || ""),
            country: String(values.country || "Colombia"),
            isDefault: values.isDefault,
        });
    };

    const title = (
        <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            {isEditing ? "Editar dirección" : "Nueva dirección"}
        </span>
    );
    const description = isEditing
        ? "Actualiza los datos de la dirección guardada."
        : "Ingresa la información de tu nueva dirección de envío o facturación.";

    const formBodyProps = { formId: "address-form", register, control, errors };

    const submitButton = (
        <Button type="submit" form="address-form" disabled={isSubmitting} className="gap-2">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isEditing ? "Guardar cambios" : "Agregar dirección"}
        </Button>
    );

    const cancelButton = (
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
        </Button>
    );

    /* Desktop: right Sheet */
    if (isDesktop) {
        return (
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent side="right" className="w-full sm:max-w-md flex flex-col overflow-y-auto p-0">
                    <SheetHeader className="px-4 pt-5 pb-0">
                        <SheetTitle>{title}</SheetTitle>
                        <SheetDescription>{description}</SheetDescription>
                    </SheetHeader>
                    <Separator className="mt-4" />
                    <form id="address-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate className="flex flex-col flex-1 overflow-y-auto">
                        <AddressFormBody {...formBodyProps} />
                        <Separator />
                        <SheetFooter className="px-4 py-3 flex-row gap-2 justify-end">
                            {cancelButton}
                            {submitButton}
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        );
    }

    /* Mobile: bottom Drawer */
    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="max-h-[92vh] flex flex-col">
                <DrawerHeader className="text-left px-4 pt-4 pb-0">
                    <DrawerTitle>{title}</DrawerTitle>
                    <DrawerDescription>{description}</DrawerDescription>
                </DrawerHeader>
                <Separator className="mt-3" />
                <form id="address-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate className="flex flex-col flex-1 overflow-y-auto">
                    <AddressFormBody {...formBodyProps} />
                    <Separator />
                    <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end px-4 py-3">
                        {cancelButton}
                        {submitButton}
                    </div>
                </form>
            </DrawerContent>
        </Drawer>
    );
}

// Re-export under the old name so CheckoutAddressStep doesn't need changes
export { AddressFormPanel as AddressFormSheet };
export type { AddressFormPanelProps as AddressFormSheetProps };
