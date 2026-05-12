/**
 * AddressFormSheet — Shadcn Sheet (side drawer) for creating or editing an address.
 *
 * UI ONLY — all logic (CRUD mutations, form state, open/close) lives in useAddresses.
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
 * @module components/features/marketplace/checkout/AddressFormSheet
 */

"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Address, CreateAddressRequest } from "@/types/marketplace";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

// ─── Colombian departments ───────────────────────────────────────────────────

const COLOMBIAN_DEPARTMENTS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
] as const;

// ─── Zod schema ──────────────────────────────────────────────────────────────

/**
 * Colombian phone regex:
 *  - Starts with +57 followed by 10 digits, OR
 *  - Starts with 3 followed by 9 more digits (mobile format)
 */
const colombianPhoneRegex = /^(\+57\s?)?3\d{9}$/;

const addressFormSchema = z.object({
  label: z
    .string()
    .min(1, "El nombre de la dirección es requerido.")
    .max(50, "Máximo 50 caracteres."),
  fullName: z
    .string()
    .min(3, "El nombre completo debe tener al menos 3 caracteres.")
    .max(100, "Máximo 100 caracteres."),
  phone: z
    .string()
    .min(1, "El teléfono es requerido.")
    .regex(
      colombianPhoneRegex,
      "Ingresa un número colombiano válido (ej: 3001234567 o +573001234567).",
    ),
  addressLine1: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres.")
    .max(200, "Máximo 200 caracteres."),
  addressLine2: z.string().max(200, "Máximo 200 caracteres.").optional(),
  city: z
    .string()
    .min(2, "La ciudad es requerida.")
    .max(100, "Máximo 100 caracteres."),
  department: z.string().min(1, "Selecciona un departamento."),
  postalCode: z.string().max(10, "Máximo 10 caracteres.").optional(),
  country: z.string().min(1),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AddressFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAddressRequest) => void;
  isSubmitting: boolean;
  editingAddress?: Address | null;
}

// ─── Helper: map Address → form values ───────────────────────────────────────

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
  label: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  department: "",
  postalCode: "",
  country: "Colombia",
  isDefault: false,
};

// ─── Field error helper ───────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive mt-1">
      {message}
    </p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddressFormSheet({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingAddress,
}: AddressFormSheetProps) {
  const isEditing = !!editingAddress;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addressFormSchema) as any,
    defaultValues: DEFAULT_FORM_VALUES,
  });

  /* ── Pre-fill / reset on open ──────────────────────────────────────── */

  useEffect(() => {
    if (isOpen) {
      reset(isEditing ? toFormValues(editingAddress!) : DEFAULT_FORM_VALUES);
    }
  }, [isOpen, isEditing, editingAddress, reset]);

  /* ── Submit handler ────────────────────────────────────────────────── */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = (values: any) => {
    const payload: CreateAddressRequest = {
      addressType: values.label as string,
      recipientName: values.fullName as string,
      phoneNumber: values.phone as string,
      streetLine1: values.addressLine1 as string,
      streetLine2: (values.addressLine2 as string | undefined) || undefined,
      city: values.city as string,
      department: values.department as string,
      postalCode: String(values.postalCode || ""),
      country: String(values.country || "Colombia"),
      isDefault: values.isDefault as boolean,
    };
    onSubmit(payload);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col overflow-y-auto"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <SheetHeader className="pb-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            {isEditing ? "Editar dirección" : "Nueva dirección"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Actualiza los datos de la dirección guardada."
              : "Ingresa la información de tu nueva dirección de envío o facturación."}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        {/* ── Form ───────────────────────────────────────────── */}
        <form
          id="address-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {/* Label */}
          <div className="space-y-1.5">
            <Label htmlFor="addr-label">
              Nombre de la dirección{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <Input
              id="addr-label"
              placeholder="Ej: Casa, Trabajo, Otro..."
              autoComplete="off"
              aria-describedby={errors.label ? "addr-label-error" : undefined}
              aria-invalid={!!errors.label}
              {...register("label")}
            />
            <FieldError message={errors.label?.message} />
          </div>

          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="addr-fullname">
              Nombre completo del destinatario{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <Input
              id="addr-fullname"
              placeholder="Nombre y apellidos"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              {...register("fullName")}
            />
            <FieldError message={errors.fullName?.message} />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="addr-phone">
              Teléfono de contacto{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <Input
              id="addr-phone"
              type="tel"
              placeholder="3001234567 o +573001234567"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              {...register("phone")}
            />
            <FieldError message={errors.phone?.message} />
          </div>

          <Separator />

          {/* Address line 1 */}
          <div className="space-y-1.5">
            <Label htmlFor="addr-line1">
              Dirección{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <Input
              id="addr-line1"
              placeholder="Calle, carrera, número..."
              autoComplete="address-line1"
              aria-invalid={!!errors.addressLine1}
              {...register("addressLine1")}
            />
            <FieldError message={errors.addressLine1?.message} />
          </div>

          {/* Address line 2 */}
          <div className="space-y-1.5">
            <Label htmlFor="addr-line2">
              Complemento{" "}
              <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input
              id="addr-line2"
              placeholder="Apartamento, barrio, referencia..."
              autoComplete="address-line2"
              {...register("addressLine2")}
            />
            <FieldError message={errors.addressLine2?.message} />
          </div>

          {/* City + Department (2 columns on sm+) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* City */}
            <div className="space-y-1.5">
              <Label htmlFor="addr-city">
                Ciudad{" "}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </Label>
              <Input
                id="addr-city"
                placeholder="Ej: Manizales"
                autoComplete="address-level2"
                aria-invalid={!!errors.city}
                {...register("city")}
              />
              <FieldError message={errors.city?.message} />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label htmlFor="addr-department">
                Departamento{" "}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </Label>
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="addr-department"
                      aria-invalid={!!errors.department}
                      className="w-full"
                    >
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOMBIAN_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.department?.message} />
            </div>
          </div>

          {/* Postal code */}
          <div className="space-y-1.5">
            <Label htmlFor="addr-postal">
              Código postal{" "}
              <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input
              id="addr-postal"
              placeholder="Ej: 170001"
              autoComplete="postal-code"
              maxLength={10}
              {...register("postalCode")}
            />
            <FieldError message={errors.postalCode?.message} />
          </div>

          <Separator />

          {/* Is default */}
          <div className="flex items-center gap-3">
            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="addr-default"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Establecer como dirección predeterminada"
                />
              )}
            />
            <Label
              htmlFor="addr-default"
              className="text-sm cursor-pointer leading-snug"
            >
              Establecer como dirección predeterminada
            </Label>
          </div>
        </form>

        {/* ── Footer ─────────────────────────────────────────── */}
        <Separator />
        <SheetFooter className="px-4 py-3 flex-row gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="address-form"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {isEditing ? "Guardar cambios" : "Agregar dirección"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
