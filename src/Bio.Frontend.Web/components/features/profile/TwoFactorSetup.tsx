"use client";

/**
 * TwoFactorSetup — 2FA management card for the security tab.
 *
 * Shows current 2FA status and allows:
 * - Setup: generates QR code → verify code → enable
 * - Disable: confirm dialog → disable
 *
 * @module components/features/profile/TwoFactorSetup
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    useDisableTwoFactor,
    useSetupTwoFactor,
    useVerifyTwoFactor,
} from "@/hooks/features/auth";
import {
    twoFactorCodeSchema,
    type TwoFactorCodeFormValues,
} from "@/lib/validators/auth-validators";
import type { TwoFactorSetupResponse } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Loader2,
    Lock,
    ShieldCheck,
    ShieldOff,
    Unlock,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

interface TwoFactorSetupProps {
    /** Current 2FA status from user profile */
    enabled: boolean;
    /** Callback when 2FA status changes */
    onStatusChange?: (enabled: boolean) => void;
}

export function TwoFactorSetup({
    enabled,
    onStatusChange,
}: TwoFactorSetupProps) {
    const [setupData, setSetupData] =
        useState<TwoFactorSetupResponse | null>(null);
    const [showSetupDialog, setShowSetupDialog] = useState(false);
    const [showDisableDialog, setShowDisableDialog] = useState(false);

    const setupMutation = useSetupTwoFactor();
    const verifyMutation = useVerifyTwoFactor();
    const disableMutation = useDisableTwoFactor();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TwoFactorCodeFormValues>({
        resolver: zodResolver(twoFactorCodeSchema),
        defaultValues: { code: "" },
    });

    const handleStartSetup = useCallback(() => {
        setupMutation.mutate(undefined, {
            onSuccess: (data) => {
                setSetupData(data);
                setShowSetupDialog(true);
            },
        });
    }, [setupMutation]);

    function onVerify(values: TwoFactorCodeFormValues) {
        verifyMutation.mutate(values.code, {
            onSuccess: () => {
                setShowSetupDialog(false);
                setSetupData(null);
                reset();
                onStatusChange?.(true);
            },
        });
    }

    function handleDisable() {
        disableMutation.mutate(undefined, {
            onSuccess: () => {
                setShowDisableDialog(false);
                onStatusChange?.(false);
            },
        });
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                {enabled ? (
                                    <ShieldCheck
                                        className="h-5 w-5 text-green-500"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <ShieldOff
                                        className="h-5 w-5 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                )}
                                Autenticacion de dos factores
                            </CardTitle>
                            <CardDescription>
                                Agrega una capa extra de seguridad a tu
                                cuenta usando una app autenticadora (TOTP).
                            </CardDescription>
                        </div>
                        <Badge
                            variant={enabled ? "default" : "secondary"}
                        >
                            {enabled ? "Activo" : "Inactivo"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {enabled ? (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Tu cuenta esta protegida con autenticacion
                                de dos factores. Al iniciar sesion se te
                                pedira un codigo de 6 digitos de tu app
                                autenticadora.
                            </p>
                            <Button
                                id="disable-2fa-button"
                                variant="outline"
                                onClick={() => setShowDisableDialog(true)}
                            >
                                <Unlock
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Desactivar 2FA
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                La autenticacion de dos factores no esta
                                activa. Activala para mayor seguridad.
                            </p>
                            <Button
                                id="setup-2fa-button"
                                onClick={handleStartSetup}
                                disabled={setupMutation.isPending}
                            >
                                {setupMutation.isPending ? (
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <Lock
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                )}
                                Configurar 2FA
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Setup Dialog ─────────────────────────────────── */}
            <Dialog
                open={showSetupDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowSetupDialog(false);
                        setSetupData(null);
                        reset();
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Configurar autenticacion de dos factores
                        </DialogTitle>
                        <DialogDescription>
                            Escanea el codigo QR con tu app autenticadora
                            (Google Authenticator, Authy, etc.) e ingresa
                            el codigo de verificacion.
                        </DialogDescription>
                    </DialogHeader>

                    {setupData && (
                        <div className="space-y-4">
                            {/* QR Code */}
                            <div className="flex justify-center rounded-lg border bg-white p-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.authenticatorUri)}`}
                                    alt="Codigo QR para autenticacion"
                                    width={200}
                                    height={200}
                                    className="h-[200px] w-[200px]"
                                />
                            </div>

                            <Separator />

                            {/* Manual key */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Clave manual
                                </Label>
                                <p className="rounded-md bg-muted px-3 py-2 font-mono text-sm tracking-wider">
                                    {setupData.sharedKey}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Si no puedes escanear el QR, ingresa
                                    esta clave manualmente en tu app.
                                </p>
                            </div>

                            <Separator />

                            {/* Verification code input */}
                            <form
                                onSubmit={handleSubmit(onVerify)}
                                noValidate
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="setup-2fa-code">
                                        Codigo de verificacion
                                    </Label>
                                    <Input
                                        id="setup-2fa-code"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="000000"
                                        maxLength={6}
                                        autoComplete="one-time-code"
                                        aria-invalid={!!errors.code}
                                        aria-describedby={
                                            errors.code
                                                ? "setup-2fa-code-error"
                                                : undefined
                                        }
                                        {...register("code")}
                                    />
                                    {errors.code && (
                                        <p
                                            id="setup-2fa-code-error"
                                            className="text-sm text-destructive"
                                            role="alert"
                                        >
                                            {errors.code.message}
                                        </p>
                                    )}
                                </div>

                                <DialogFooter className="mt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowSetupDialog(false);
                                            setSetupData(null);
                                            reset();
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        id="verify-2fa-submit"
                                        type="submit"
                                        disabled={
                                            verifyMutation.isPending
                                        }
                                    >
                                        {verifyMutation.isPending && (
                                            <Loader2
                                                className="h-4 w-4 animate-spin"
                                                aria-hidden="true"
                                            />
                                        )}
                                        Verificar y activar
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Disable Confirmation Dialog ──────────────────── */}
            <Dialog
                open={showDisableDialog}
                onOpenChange={setShowDisableDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Desactivar autenticacion de dos factores
                        </DialogTitle>
                        <DialogDescription>
                            Al desactivar 2FA, tu cuenta solo sera
                            protegida por tu contrasena. Esta seguro de
                            continuar?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDisableDialog(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            id="confirm-disable-2fa"
                            variant="destructive"
                            onClick={handleDisable}
                            disabled={disableMutation.isPending}
                        >
                            {disableMutation.isPending && (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            Desactivar 2FA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
