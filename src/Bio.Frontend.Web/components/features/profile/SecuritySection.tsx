"use client";

/**
 * SecuritySection — security tab in the profile page.
 *
 * Contains:
 * - Change Password card (React Hook Form + Zod)
 * - Two-Factor Authentication card (TwoFactorSetup component)
 *
 * @module components/features/profile/SecuritySection
 */

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
import { TwoFactorSetup } from "@/components/features/profile/TwoFactorSetup";
import { useChangePassword } from "@/hooks/features/auth";
import {
    changePasswordSchema,
    type ChangePasswordFormValues,
} from "@/lib/validators/auth-validators";
import { useAuthStore } from "@/store/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function SecuritySection() {
    const { user } = useAuthStore();
    const changePasswordMutation = useChangePassword();

    // Track 2FA local state (mirrors store but allows instant UI update)
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(
        user?.twoFactorEnabled ?? false,
    );

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        },
    });

    function onSubmitPassword(values: ChangePasswordFormValues) {
        changePasswordMutation.mutate(values, {
            onSuccess: () => {
                reset();
            },
        });
    }

    return (
        <div className="space-y-6">
            {/* ── Change Password ──────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound
                            className="h-5 w-5"
                            aria-hidden="true"
                        />
                        Cambiar contrasena
                    </CardTitle>
                    <CardDescription>
                        Actualiza tu contrasena para mantener tu cuenta
                        segura.
                    </CardDescription>
                </CardHeader>

                <form
                    onSubmit={handleSubmit(onSubmitPassword)}
                    noValidate
                >
                    <CardContent className="space-y-4">
                        {/* Current Password */}
                        <div className="space-y-2">
                            <Label htmlFor="current-password">
                                Contrasena actual
                            </Label>
                            <Input
                                id="current-password"
                                type="password"
                                placeholder="Tu contrasena actual"
                                autoComplete="current-password"
                                aria-invalid={!!errors.currentPassword}
                                aria-describedby={
                                    errors.currentPassword
                                        ? "current-password-error"
                                        : undefined
                                }
                                {...register("currentPassword")}
                            />
                            {errors.currentPassword && (
                                <p
                                    id="current-password-error"
                                    className="text-sm text-destructive"
                                    role="alert"
                                >
                                    {errors.currentPassword.message}
                                </p>
                            )}
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="new-password">
                                Nueva contrasena
                            </Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="Minimo 8 caracteres"
                                autoComplete="new-password"
                                aria-invalid={!!errors.newPassword}
                                aria-describedby={
                                    errors.newPassword
                                        ? "new-password-error"
                                        : undefined
                                }
                                {...register("newPassword")}
                            />
                            {errors.newPassword && (
                                <p
                                    id="new-password-error"
                                    className="text-sm text-destructive"
                                    role="alert"
                                >
                                    {errors.newPassword.message}
                                </p>
                            )}
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">
                                Confirmar nueva contrasena
                            </Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Repite la nueva contrasena"
                                autoComplete="new-password"
                                aria-invalid={
                                    !!errors.confirmNewPassword
                                }
                                aria-describedby={
                                    errors.confirmNewPassword
                                        ? "confirm-password-error"
                                        : undefined
                                }
                                {...register("confirmNewPassword")}
                            />
                            {errors.confirmNewPassword && (
                                <p
                                    id="confirm-password-error"
                                    className="text-sm text-destructive"
                                    role="alert"
                                >
                                    {errors.confirmNewPassword.message}
                                </p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col items-start gap-3 pt-2">
                        <Button
                            id="change-password-submit"
                            type="submit"
                            disabled={changePasswordMutation.isPending}
                        >
                            {changePasswordMutation.isPending ? (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <KeyRound
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            )}
                            {changePasswordMutation.isPending
                                ? "Cambiando..."
                                : "Cambiar contrasena"}
                        </Button>
                        <button
                            type="button"
                            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                            onClick={() => {
                                toast.info(
                                    "Por implementar: recuperacion de contrasena por correo.",
                                );
                            }}
                        >
                            Olvidaste tu contrasena?
                        </button>
                    </CardFooter>
                </form>
            </Card>

            {/* ── Two-Factor Authentication ────────────────────── */}
            <TwoFactorSetup
                enabled={twoFactorEnabled}
                onStatusChange={setTwoFactorEnabled}
            />
        </div>
    );
}
