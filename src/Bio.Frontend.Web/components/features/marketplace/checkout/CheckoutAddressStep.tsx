/**
 * CheckoutAddressStep — Step 2: Shipping + billing address selection.
 *
 * Consumes real addresses passed as props (fetched by useCheckout via React Query).
 * Displays a loading skeleton while addresses are being fetched.
 * Shows an "Agregar dirección" CTA when the user has no saved addresses.
 * Opens AddressFormSheet (Shadcn Sheet) when creating a new address.
 *
 * UI ONLY — all logic lives in useCheckout + useAddresses.
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 */

"use client";

import { AddressFormSheet } from "@/components/features/marketplace/checkout/AddressFormSheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddresses } from "@/hooks/features/marketplace";
import { cn } from "@/lib/utils";
import type { Address } from "@/types/marketplace";
import {
  ArrowLeft,
  CheckCircle,
  MapPin,
  Phone,
  Plus,
  User,
} from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CheckoutAddressStepProps {
  addresses: Address[];
  isLoadingAddresses: boolean;
  shippingAddressId: string | null;
  billingAddressId: string | null;
  useSameAddress: boolean;
  onShippingChange: (id: string) => void;
  onBillingChange: (id: string) => void;
  onUseSameAddressChange: (val: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
  canContinue: boolean;
}

// ─── AddressCard ──────────────────────────────────────────────────────────────

function AddressCard({
  address,
  isSelected,
  onSelect,
}: {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Seleccionada: " : "Seleccionar: "}${address.addressType} — ${address.recipientName}, ${address.streetLine1}, ${address.city}`}
      className={cn(
        "w-full text-left rounded-lg border p-4 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{address.addressType}</span>
            {address.isDefault && (
              <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                Predeterminada
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{address.recipientName}</span>
          </div>
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin
              className="h-3.5 w-3.5 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>
              {address.streetLine1}
              {address.streetLine2 && `, ${address.streetLine2}`}
              <br />
              {address.city}, {address.department}
              {address.postalCode && `, ${address.postalCode}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{address.phoneNumber}</span>
          </div>
        </div>
        {isSelected && (
          <CheckCircle
            className="h-5 w-5 text-primary shrink-0 mt-0.5"
            aria-hidden="true"
          />
        )}
      </div>
    </button>
  );
}

// ─── AddressListSkeleton ──────────────────────────────────────────────────────

function AddressListSkeleton() {
  return (
    <div
      className="space-y-3"
      aria-busy="true"
      aria-label="Cargando direcciones"
    >
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

// ─── EmptyAddressCTA ──────────────────────────────────────────────────────────

function EmptyAddressCTA({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <MapPin className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-medium">No tienes direcciones guardadas</p>
        <p className="text-xs text-muted-foreground mt-1">
          Agrega una dirección para continuar con el pago.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Agregar dirección
      </Button>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CheckoutAddressStep({
  addresses,
  isLoadingAddresses,
  shippingAddressId,
  billingAddressId,
  useSameAddress,
  onShippingChange,
  onBillingChange,
  onUseSameAddressChange,
  onContinue,
  onBack,
  canContinue,
}: CheckoutAddressStepProps) {
  /* ── Address form sheet (create only from checkout) ─────────────────── */
  const {
    formOpen,
    editingAddress,
    openCreateForm,
    closeForm,
    createAddress,
    isCreating,
  } = useAddresses();

  const hasAddresses = addresses.length > 0;

  return (
    <div className="space-y-6">
      {/* ── AddressFormSheet ──────────────────────────────────────── */}
      <AddressFormSheet
        isOpen={formOpen}
        onClose={closeForm}
        onSubmit={(data) => createAddress(data)}
        isSubmitting={isCreating}
        editingAddress={editingAddress}
      />

      {/* ── Shipping Address ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                Dirección de Envío
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Selecciona dónde quieres recibir tu pedido.
              </p>
            </div>
            {hasAddresses && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openCreateForm}
                className="gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nueva dirección
              </Button>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          {isLoadingAddresses ? (
            <AddressListSkeleton />
          ) : !hasAddresses ? (
            <EmptyAddressCTA onAdd={openCreateForm} />
          ) : (
            addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                isSelected={shippingAddressId === addr.id}
                onSelect={() => onShippingChange(addr.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Billing Address ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Dirección de Facturación</h2>
          <div className="flex items-center gap-2 mt-2">
            <Checkbox
              id="same-address"
              checked={useSameAddress}
              onCheckedChange={(checked) => onUseSameAddressChange(!!checked)}
            />
            <Label htmlFor="same-address" className="text-sm cursor-pointer">
              Usar la misma dirección de envío
            </Label>
          </div>
        </CardHeader>

        {!useSameAddress && (
          <>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              {isLoadingAddresses ? (
                <AddressListSkeleton />
              ) : !hasAddresses ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Agrega una dirección de envío primero.
                </p>
              ) : (
                addresses.map((addr) => (
                  <AddressCard
                    key={addr.id}
                    address={addr}
                    isSelected={billingAddressId === addr.id}
                    onSelect={() => onBillingChange(addr.id)}
                  />
                ))
              )}
            </CardContent>
          </>
        )}
      </Card>

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Button>
        <Button
          onClick={onContinue}
          disabled={!canContinue || isLoadingAddresses}
          size="lg"
        >
          Continuar al pago
        </Button>
      </div>
    </div>
  );
}
