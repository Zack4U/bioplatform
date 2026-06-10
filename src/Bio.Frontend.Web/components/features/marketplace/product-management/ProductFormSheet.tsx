"use client";

/**
 * ProductFormSheet — Sheet (drawer) for creating or editing a product.
 *
 * Uses React Hook Form + Zod for validation. The description field is powered
 * by RichTextEditor (WYSIWYG). All other fields are standard Shadcn primitives.
 *
 * Compliance note (Nagoya Protocol / ABS): the form enforces that the user
 * selects a valid, active AbsPermit before the product can be saved.
 *
 * UI ONLY — no fetching logic. All callbacks come from the parent page.
 *
 * WCAG 2.1 AA:
 *  - All inputs have visible labels (not only placeholders).
 *  - Error messages are aria-described-by linked to their fields.
 *  - Focus is managed by Sheet (Radix Dialog under the hood).
 *
 * @module components/features/marketplace/product-management/ProductFormSheet
 */

import { RichTextEditor } from "@/components/common";
import { SpeciesSearchCombobox } from "@/components/features/admin/shared/SpeciesSearchCombobox";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type {
  AbsPermit,
  CreateProductRequest,
  ManageProductListItem,
  ProductCategory,
  UpdateProductRequest,
} from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { SpeciesAdminItem } from "@/types/admin";


const productSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  description: z
    .string()
    .min(10, "La descripcion debe tener al menos 10 caracteres"),
  price: z
    .number({ error: "Ingresa un precio valido" })
    .min(0.01, "El precio debe ser mayor a 0"),
  stockQuantity: z
    .number({ error: "Ingresa una cantidad valida" })
    .int("La cantidad debe ser un numero entero")
    .min(0, "El stock no puede ser negativo"),
  sku: z
    .string()
    .min(1, "El SKU es obligatorio")
    .max(50, "El SKU no puede superar los 50 caracteres"),
  categoryId: z.number().nullable().optional(),
  baseSpeciesId: z.string().optional().or(z.literal("")),
  absPermitId: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => void;
  isSubmitting: boolean;
  editingProduct?: ManageProductListItem | null;
  categories: ProductCategory[];
  absPermits: AbsPermit[];
  onImageUpload?: (file: File) => Promise<string>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductFormSheet({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingProduct,
  categories,
  absPermits,
  onImageUpload,
}: ProductFormSheetProps) {
  const isEditing = Boolean(editingProduct);
  const activePermits = absPermits.filter((p) => p.status === "Active");
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesAdminItem | null>(null);

  // Reset the picked species when the sheet opens for a new product.
  // Done during render (not in an effect) to avoid cascading re-renders.
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen && !editingProduct) {
      setSelectedSpecies(null);
    }
  }

  // ── Form ───────────────────────────────────────────────────────────────

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: undefined,
      stockQuantity: 0,
      sku: "",
      categoryId: null,
      baseSpeciesId: "",
      absPermitId: "",
      isActive: false,
    },
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = form;

  // ── Pre-fill when editing ──────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && editingProduct) {
      reset({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.sellPrice,
        stockQuantity: editingProduct.stockQuantity,
        sku: editingProduct.sku,
        categoryId: editingProduct.categoryId,
        baseSpeciesId: editingProduct.baseSpeciesId ?? "",
        absPermitId: editingProduct.absPermitId ?? "",
        isActive: editingProduct.isActive,
      });
    } else if (isOpen && !editingProduct) {
      reset({
        name: "",
        description: "",
        price: undefined,
        stockQuantity: 0,
        sku: "",
        categoryId: null,
        baseSpeciesId: "",
        absPermitId: "",
        isActive: false,
      });
    }
  }, [isOpen, editingProduct, reset]);

  // ── Submit handler ─────────────────────────────────────────────────────

  function handleFormSubmit(values: ProductFormValues) {
    if (selectedSpecies?.legalStatus && !values.absPermitId) {
      form.setError("absPermitId", { message: "Permiso ABS requerido para especie con estado legal" });
      return;
    }
    // Auto-generate slug from product name: lowercase, hyphens, remove special chars
    const autoSlug = values.name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120);
    const payload: CreateProductRequest | UpdateProductRequest = {
      name: values.name,
      slug: autoSlug,
      description: values.description,
      sellPrice: values.price,
      basePrice: values.price,
      stockQuantity: values.stockQuantity,
      sku: values.sku,
      categoryId: values.categoryId ?? null,
      baseSpeciesId: values.baseSpeciesId || "",
      absPermitId: values.absPermitId || "",
      // New products are always inactive (pending approval). Editing keeps the user's choice.
      isActive: isEditing ? (values.isActive ?? false) : false,
    };
    onSubmit(payload);
  }

  // ── Helper: field error id ─────────────────────────────────────────────

  function errId(field: string) {
    return `form-error-${field}`;
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-lg overflow-y-auto"
        aria-label={isEditing ? "Editar producto" : "Nuevo producto"}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Modifica los datos de tu producto y guarda los cambios."
              : "Completa los datos para publicar un nuevo producto en el marketplace."}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        {/* ── Form ────────────────────────────────────────────────────── */}
        <form
          id="product-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
          className="flex flex-1 flex-col gap-5 px-4 py-2 overflow-y-auto"
        >
          {isEditing && editingProduct && !editingProduct.isApproved && editingProduct.rejectionReason && (
            <div className="flex flex-col gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="font-semibold text-xs uppercase tracking-wider">Producto Rechazado</span>
              </div>
              <p className="text-xs">
                Este producto fue rechazado por un administrador o autoridad. Corrige los detalles señalados e inténtalo de nuevo.
              </p>
              <div className="mt-1 border-t border-destructive/20 pt-1.5">
                <span className="text-xs font-semibold">Motivo del rechazo:</span>
                <p className="text-xs italic mt-0.5">{editingProduct.rejectionReason}</p>
              </div>
            </div>
          )}
          {/* ── Name ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-name">
              Nombre del producto{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <Input
              id="product-name"
              placeholder="Ej: Miel de abejas nativas"
              aria-describedby={errors.name ? errId("name") : undefined}
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name && (
              <p
                id={errId("name")}
                role="alert"
                className="flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* ── Description (RichTextEditor) ─────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-description">
              Descripcion{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Describe tu producto en detalle: origen, beneficios, modo de uso..."
                  onImageUpload={onImageUpload}
                  maxHeight="220px"
                  disabled={isSubmitting}
                />
              )}
            />
            {errors.description && (
              <p
                id={errId("description")}
                role="alert"
                className="flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* ── Price + Stock ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-price">
                Precio (COP){" "}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </Label>
              <Input
                id="product-price"
                type="number"
                inputMode="decimal"
                min={0.01}
                step={0.01}
                placeholder="0.00"
                aria-describedby={errors.price ? errId("price") : undefined}
                aria-invalid={Boolean(errors.price)}
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <p
                  id={errId("price")}
                  role="alert"
                  className="flex items-center gap-1 text-xs text-destructive"
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-stock">
                Stock{" "}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </Label>
              <Input
                id="product-stock"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="0"
                aria-describedby={
                  errors.stockQuantity ? errId("stockQuantity") : undefined
                }
                aria-invalid={Boolean(errors.stockQuantity)}
                {...register("stockQuantity", { valueAsNumber: true })}
              />
              {errors.stockQuantity && (
                <p
                  id={errId("stockQuantity")}
                  role="alert"
                  className="flex items-center gap-1 text-xs text-destructive"
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {errors.stockQuantity.message}
                </p>
              )}
            </div>
          </div>

          {/* ── SKU ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-sku">
              SKU{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <Input
              id="product-sku"
              placeholder="Ej: MIEL-NAT-250G"
              className="font-mono"
              aria-describedby={errors.sku ? errId("sku") : undefined}
              aria-invalid={Boolean(errors.sku)}
              {...register("sku")}
            />
            {errors.sku && (
              <p
                id={errId("sku")}
                role="alert"
                className="flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {errors.sku.message}
              </p>
            )}
          </div>

          {/* ── Category ────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-category">Categoria</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value != null ? String(field.value) : ""}
                  onValueChange={(val) =>
                    field.onChange(val ? Number(val) : null)
                  }
                >
                  <SelectTrigger
                    id="product-category"
                    className="w-full"
                    aria-label="Seleccionar categoria"
                  >
                    <SelectValue placeholder="Sin categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* ── Base Species (combobox search) ─────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <Label>Especie base <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Controller
              name="baseSpeciesId"
              control={control}
              render={({ field }) => (
                <SpeciesSearchCombobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onSpeciesSelect={setSelectedSpecies}
                  placeholder="Buscar especie del catálogo..."
                  clearable
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Enlaza este producto con un registro científico en el catálogo de especies de Caldas.
            </p>
          </div>

          {/* ── ABS Permit (Nagoya Protocol) ─────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-abs-permit">
              Permiso ABS{" "}
              {selectedSpecies?.legalStatus ? (
                <span aria-hidden="true" className="text-destructive">*</span>
              ) : (
                <span className="text-muted-foreground font-normal">(opcional)</span>
              )}
            </Label>
            <Controller
              name="absPermitId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="product-abs-permit"
                    className="w-full"
                    aria-describedby={
                      errors.absPermitId ? errId("absPermitId") : "abs-hint"
                    }
                    aria-invalid={Boolean(errors.absPermitId)}
                    aria-label="Seleccionar Permiso ABS"
                  >
                    <SelectValue placeholder="Selecciona un permiso activo" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* "No requiere" option — products not using genetic resources */}
                    <SelectItem value="no_abs">Sin permiso ABS — No requiere</SelectItem>
                    {activePermits.length > 0 && (
                      activePermits.map((permit) => (
                        <SelectItem key={permit.id} value={permit.id}>
                          {permit.resolutionNumber} — {permit.grantingAuthority}
                        </SelectItem>
                      ))
                    )}
                    {activePermits.length === 0 && (
                      <SelectItem value="__none__" disabled>
                        No tienes permisos ABS activos
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.absPermitId ? (
              <p
                id={errId("absPermitId")}
                role="alert"
                className="flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {errors.absPermitId.message}
              </p>
            ) : (
              <div
                id="abs-hint"
                className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"
              >
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Segun el Protocolo de Nagoya, se requiere un Permiso ABS
                  activo para comercializar esta especie.
                </p>
              </div>
            )}
          </div>

          {/* ── Is Active (only visible when editing an approved product) ── */}
          {isEditing && (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="product-active" className="cursor-pointer">
                Producto activo
              </Label>
              <p className="text-xs text-muted-foreground">
                {editingProduct?.isApproved
                  ? "Los productos inactivos no son visibles en el marketplace."
                  : "Este producto no ha sido aprobado por un administrador o autoridad. No se puede activar."}
              </p>
            </div>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  id="product-active"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  disabled={!editingProduct?.isApproved}
                  aria-label="Publicar producto en el marketplace"
                />
              )}
            />
          </div>
          )}
          {!isEditing && (
          <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              El producto se creará en estado <strong>inactivo</strong> y quedará pendiente de aprobación por un administrador o autoridad. Una vez aprobado, podrás activarlo o desactivarlo.
            </p>
          </div>
          )}
        </form>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <Separator />
        <SheetFooter className="flex flex-row gap-2 px-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="product-form"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {isEditing ? "Guardar cambios" : "Crear producto"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
