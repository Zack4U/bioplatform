/**
 * AddressBook — manage shipping/billing addresses from the profile tab.
 * Uses useAddresses hook (already implemented).
 *
 * @module components/features/profile/AddressBook
 */

"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddresses } from "@/hooks/features/marketplace";
import type { Address, CreateAddressRequest } from "@/types";
import { MapPin, Plus, Star, Trash2, Pencil } from "lucide-react";
import { useState } from "react";

type AddressFormState = CreateAddressRequest & { id?: string };

const EMPTY_FORM: AddressFormState = {
    addressType: "",
    recipientName: "",
    phoneNumber: "",
    streetLine1: "",
    streetLine2: "",
    city: "",
    department: "",
    postalCode: "",
    country: "CO",
    isDefault: false,
};

export function AddressBook() {
    const {
        addresses,
        isLoading,
        createAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        isCreating,
        isUpdating,
    } = useAddresses();

    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);

    function openCreate() {
        setForm(EMPTY_FORM);
        setFormOpen(true);
    }

    function openEdit(addr: Address) {
        setForm({
            id: addr.id,
            addressType: addr.addressType,
            recipientName: addr.recipientName,
            phoneNumber: addr.phoneNumber ?? "",
            streetLine1: addr.streetLine1,
            streetLine2: addr.streetLine2 ?? "",
            city: addr.city,
            department: addr.department,
            postalCode: addr.postalCode,
            country: addr.country,
            isDefault: addr.isDefault,
        });
        setFormOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const { id, ...data } = form;
        if (id) {
            updateAddress({ id, data });
        } else {
            createAddress(data);
        }
        setFormOpen(false);
    }

    function setField<K extends keyof AddressFormState>(key: K, value: AddressFormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    const isSubmitting = isCreating || isUpdating;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Mis Direcciones</h2>
                    <p className="text-sm text-muted-foreground">
                        Gestiona tus direcciones de envio y facturacion
                    </p>
                </div>
                <Button onClick={openCreate} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva direccion
                </Button>
            </div>

            {isLoading && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            )}

            {!isLoading && addresses.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
                        <MapPin className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">
                            No tienes direcciones guardadas. Agrega una para facilitar tus compras.
                        </p>
                        <Button variant="outline" size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar direccion
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!isLoading && addresses.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.map((addr) => (
                        <Card
                            key={addr.id}
                            className={`relative transition-all ${addr.isDefault ? "ring-2 ring-primary" : ""}`}
                        >
                            <CardHeader className="pb-3">
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
                                <p>{addr.city}, {addr.department} {addr.postalCode}</p>
                                {addr.phoneNumber && <p>{addr.phoneNumber}</p>}

                                <div className="flex items-center gap-2 pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => openEdit(addr)}
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

            {/* ── Address form dialog ── */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {form.id ? "Editar direccion" : "Nueva direccion"}
                        </DialogTitle>
                        <DialogDescription>
                            Completa los datos de la direccion
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor="addr-type">Etiqueta (ej: Casa, Oficina)</Label>
                                <Input
                                    id="addr-type"
                                    value={form.addressType}
                                    onChange={(e) => setField("addressType", e.target.value)}
                                    placeholder="Casa"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="addr-recipient">Nombre del destinatario</Label>
                                <Input
                                    id="addr-recipient"
                                    value={form.recipientName}
                                    onChange={(e) => setField("recipientName", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="addr-line1">Direccion (linea 1)</Label>
                                <Input
                                    id="addr-line1"
                                    value={form.streetLine1}
                                    onChange={(e) => setField("streetLine1", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="addr-line2">
                                    Linea 2{" "}
                                    <span className="text-muted-foreground">(opcional)</span>
                                </Label>
                                <Input
                                    id="addr-line2"
                                    value={form.streetLine2 ?? ""}
                                    onChange={(e) => setField("streetLine2", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="addr-city">Ciudad</Label>
                                <Input
                                    id="addr-city"
                                    value={form.city}
                                    onChange={(e) => setField("city", e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="addr-dept">Departamento</Label>
                                <Input
                                    id="addr-dept"
                                    value={form.department}
                                    onChange={(e) => setField("department", e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="addr-postal">Codigo postal</Label>
                                <Input
                                    id="addr-postal"
                                    value={form.postalCode}
                                    onChange={(e) => setField("postalCode", e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="addr-phone">Telefono</Label>
                                <Input
                                    id="addr-phone"
                                    value={form.phoneNumber ?? ""}
                                    onChange={(e) => setField("phoneNumber", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
