/**
 * AddressBook — manage shipping/billing addresses from the profile tab.
 *
 * Uses the shared AddressFormPanel for create/edit:
 *   Desktop (md+) → Sheet (right side)
 *   Mobile        → Drawer (bottom)
 *
 * @module components/features/profile/AddressBook
 */

"use client";

import { AddressFormPanel } from "@/components/features/marketplace/checkout/AddressFormSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useAddresses } from "@/hooks/features/marketplace";
import type { Address } from "@/types";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";

export function AddressBook() {
    const {
        addresses,
        isLoading,
        formOpen,
        editingAddress,
        openCreateForm,
        openEditForm,
        closeForm,
        createAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        isCreating,
        isUpdating,
    } = useAddresses();

    const isSubmitting = isCreating || isUpdating;

    function handleSubmit(data: Parameters<typeof createAddress>[0]) {
        if (editingAddress) {
            updateAddress({ id: editingAddress.id, data });
        } else {
            createAddress(data);
        }
    }

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Mis Direcciones</h2>
                    <p className="text-sm text-muted-foreground">
                        Gestiona tus direcciones de envío y facturación
                    </p>
                </div>
                <Button onClick={openCreateForm} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva dirección
                </Button>
            </div>

            {/* ── Skeleton ── */}
            {isLoading && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            )}

            {/* ── Empty state ── */}
            {!isLoading && addresses.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
                        <MapPin className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground text-center">
                            No tienes direcciones guardadas.
                            <br />
                            Agrega una para facilitar tus compras.
                        </p>
                        <Button variant="outline" size="sm" onClick={openCreateForm}>
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar dirección
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ── Address cards ── */}
            {!isLoading && addresses.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.map((addr: Address) => (
                        <Card
                            key={addr.id}
                            className={`relative transition-all ${addr.isDefault ? "ring-2 ring-primary" : ""}`}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    {addr.addressType}
                                    {addr.isDefault && (
                                        <Badge variant="secondary" className="ml-auto text-xs">
                                            <Star className="mr-1 h-3 w-3 fill-current" />
                                            Predeterminada
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-sm font-medium text-foreground">
                                    {addr.recipientName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm text-muted-foreground">
                                <p>{addr.streetLine1}</p>
                                {addr.streetLine2 && <p>{addr.streetLine2}</p>}
                                <p>
                                    {addr.city}, {addr.department}{" "}
                                    {addr.postalCode}
                                </p>
                                {addr.phoneNumber && <p>{addr.phoneNumber}</p>}

                                <div className="flex items-center gap-2 pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => openEditForm(addr)}
                                    >
                                        <Pencil className="mr-1 h-3 w-3" />
                                        Editar
                                    </Button>
                                    {!addr.isDefault && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => setDefaultAddress(addr.id)}
                                        >
                                            <Star className="mr-1 h-3 w-3" />
                                            Predeterminar
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-auto h-7 text-xs text-destructive hover:text-destructive"
                                        onClick={() => deleteAddress(addr.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Unified Address Form Panel (Sheet on desktop, Drawer on mobile) ── */}
            <AddressFormPanel
                isOpen={formOpen}
                onClose={closeForm}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                editingAddress={editingAddress}
            />
        </div>
    );
}
