/**
 * CheckoutAddressStep — Step 2: Shipping + billing address selection.
 *
 * Address selector with mock addresses. Same-as-shipping toggle for billing.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Address } from "@/types/marketplace";
import {
    ArrowLeft,
    CheckCircle,
    MapPin,
    Phone,
    User,
} from "lucide-react";

interface CheckoutAddressStepProps {
    addresses: Address[];
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
            className={cn(
                "w-full text-left rounded-lg border p-4 transition-all duration-200",
                isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50",
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                            {address.label}
                        </span>
                        {address.isDefault && (
                            <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                Predeterminada
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        {address.fullName}
                    </div>
                    <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                            {address.addressLine1}
                            {address.addressLine2 &&
                                `, ${address.addressLine2}`}
                            <br />
                            {address.city}, {address.department},{" "}
                            {address.postalCode}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {address.phone}
                    </div>
                </div>
                {isSelected && (
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                )}
            </div>
        </button>
    );
}

export function CheckoutAddressStep({
    addresses,
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
    return (
        <div className="space-y-6">
            {/* Shipping Address */}
            <Card>
                <CardHeader className="pb-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Dirección de Envío
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Selecciona dónde quieres recibir tu pedido.
                    </p>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 space-y-3">
                    {addresses.map((addr) => (
                        <AddressCard
                            key={addr.id}
                            address={addr}
                            isSelected={shippingAddressId === addr.id}
                            onSelect={() => onShippingChange(addr.id)}
                        />
                    ))}
                </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
                <CardHeader className="pb-3">
                    <h2 className="text-lg font-semibold">
                        Dirección de Facturación
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <Checkbox
                            id="same-address"
                            checked={useSameAddress}
                            onCheckedChange={(checked) =>
                                onUseSameAddressChange(!!checked)
                            }
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
                            {addresses.map((addr) => (
                                <AddressCard
                                    key={addr.id}
                                    address={addr}
                                    isSelected={billingAddressId === addr.id}
                                    onSelect={() => onBillingChange(addr.id)}
                                />
                            ))}
                        </CardContent>
                    </>
                )}
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={onBack} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Button>
                <Button
                    onClick={onContinue}
                    disabled={!canContinue}
                    size="lg"
                >
                    Continuar al pago
                </Button>
            </div>
        </div>
    );
}
