"use client";

/**
 * ProfileInfoForm — personal data tab in the profile page.
 *
 * Editable form for fullName, email, phoneNumber.
 * Shows account metadata as read-only information.
 * Uses React Hook Form + Zod + useUpdateProfile hook.
 *
 * @module components/features/profile/ProfileInfoForm
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useUpdateProfile } from "@/hooks/features/auth";
import {
    updateProfileSchema,
    type UpdateProfileFormValues,
} from "@/lib/validators/auth-validators";
import { useAuthStore } from "@/store/auth-store";
import type { UserRoleName } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

/** Maps role codes to human-readable labels */
const ROLE_LABELS: Record<UserRoleName, string> = {
    ADMIN: "Administrador",
    RESEARCHER: "Investigador",
    ENTREPRENEUR: "Emprendedor",
    COMMUNITY: "Comunidad",
    BUYER: "Comprador",
    AUTHORITY: "Autoridad Ambiental",
};

export function ProfileInfoForm() {
    const { user } = useAuthStore();
    const updateMutation = useUpdateProfile();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<UpdateProfileFormValues>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            fullName: user?.fullName ?? "",
            email: user?.email ?? "",
            phoneNumber: user?.phoneNumber ?? "",
        },
    });

    // Sync form values when user state changes (after update or hydration)
    useEffect(() => {
        if (user) {
            reset({
                fullName: user.fullName ?? "",
                email: user.email ?? "",
                phoneNumber: user.phoneNumber ?? "",
            });
        }
    }, [user, reset]);

    function onSubmit(values: UpdateProfileFormValues) {
        updateMutation.mutate(values);
    }

    return (
        <div className="space-y-6">
            {/* Editable profile form */}
            <Card>
                <CardHeader>
                    <CardTitle>Informacion personal</CardTitle>
                    <CardDescription>
                        Actualiza tu nombre, correo y telefono de contacto.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <CardContent className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="profile-fullname">
                                Nombre completo
                            </Label>
                            <Input
                                id="profile-fullname"
                                type="text"
                                placeholder="Tu nombre completo"
                                autoComplete="name"
                                aria-invalid={!!errors.fullName}
                                aria-describedby={
                                    errors.fullName
                                        ? "profile-fullname-error"
                                        : undefined
                                }
                                {...register("fullName")}
                            />
                            {errors.fullName && (
                                <p
                                    id="profile-fullname-error"
                                    className="text-sm text-destructive"
                                    role="alert"
                                >
                                    {errors.fullName.message}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="profile-email">
                                Correo electronico
                            </Label>
                            <Input
                                id="profile-email"
                                type="email"
                                placeholder="correo@ejemplo.com"
                                autoComplete="email"
                                aria-invalid={!!errors.email}
                                aria-describedby={
                                    errors.email
                                        ? "profile-email-error"
                                        : undefined
                                }
                                {...register("email")}
                            />
                            {errors.email && (
                                <p
                                    id="profile-email-error"
                                    className="text-sm text-destructive"
                                    role="alert"
                                >
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="profile-phone">Telefono</Label>
                            <Input
                                id="profile-phone"
                                type="tel"
                                placeholder="+57 300 000 0000"
                                autoComplete="tel"
                                aria-invalid={!!errors.phoneNumber}
                                aria-describedby={
                                    errors.phoneNumber
                                        ? "profile-phone-error"
                                        : undefined
                                }
                                {...register("phoneNumber")}
                            />
                            {errors.phoneNumber && (
                                <p
                                    id="profile-phone-error"
                                    className="text-sm text-destructive"
                                    role="alert"
                                >
                                    {errors.phoneNumber.message}
                                </p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter>
                        <Button
                            id="profile-save"
                            type="submit"
                            className="mt-4"
                            disabled={!isDirty || updateMutation.isPending}
                        >
                            {updateMutation.isPending ? (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Save className="h-4 w-4" aria-hidden="true" />
                            )}
                            {updateMutation.isPending
                                ? "Guardando..."
                                : "Guardar cambios"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Read-only account metadata */}
            <Card>
                <CardHeader>
                    <CardTitle>Informacion de la cuenta</CardTitle>
                    <CardDescription>
                        Datos de tu cuenta que no se pueden editar directamente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">
                                ID de usuario
                            </p>
                            <p className="font-mono text-sm">
                                {user?.id ?? "—"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">
                                Fecha de registro
                            </p>
                            <p className="text-sm">
                                {user?.createdAt
                                    ? new Date(
                                          user.createdAt,
                                      ).toLocaleDateString("es-CO", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                      })
                                    : "—"}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                            Roles asignados
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {user?.roles && user.roles.length > 0 ? (
                                user.roles.map((role) => (
                                    <Badge key={role} variant="secondary">
                                        {ROLE_LABELS[role] ?? role}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Sin roles asignados
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
