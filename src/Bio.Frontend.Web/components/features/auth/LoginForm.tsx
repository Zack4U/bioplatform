"use client";

/**
 * LoginForm — handles email + password login and 2FA challenge.
 *
 * Logic lives in useLogin / useTwoFactorLogin hooks.
 * Uses React Hook Form + Zod for validation, Shadcn/ui for UI.
 *
 * @module components/features/auth/LoginForm
 */

import { TwoFactorDialog } from "@/components/features/auth/TwoFactorDialog";
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
import { useLogin, useTwoFactorLogin } from "@/hooks/features/auth";
import {
    loginSchema,
    type LoginFormValues,
} from "@/lib/validators/auth-validators";
import { useAuthStore } from "@/store/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function LoginForm() {
    const { twoFactorPending, twoFactorToken, clearTwoFactorPending } =
        useAuthStore();

    const loginMutation = useLogin();
    const twoFactorMutation = useTwoFactorLogin();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    function onSubmit(values: LoginFormValues) {
        loginMutation.mutate(values);
    }

    return (
        <>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Iniciar Sesion</CardTitle>
                    <CardDescription>
                        Ingresa tus credenciales para acceder a tu cuenta
                    </CardDescription>
                </CardHeader>

                <form
                    id="login-form"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                >
                    <CardContent className="space-y-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="login-email">
                                Correo electronico
                            </Label>
                            <Input
                                id="login-email"
                                type="email"
                                placeholder="correo@ejemplo.com"
                                autoComplete="email"
                                aria-invalid={!!errors.email}
                                aria-describedby={
                                    errors.email
                                        ? "login-email-error"
                                        : undefined
                                }
                                {...register("email")}
                            />
                            {errors.email && (
                                <p
                                    id="login-email-error"
                                    className="text-sm text-destructive"
                                    role="alert"
                                >
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="login-password">
                                    Contrasena
                                </Label>
                                <button
                                    type="button"
                                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                                    tabIndex={-1}
                                    onClick={() => {
                                        toast.info(
                                            "Por implementar: recuperacion de contrasena por correo.",
                                        );
                                    }}
                                >
                                    Olvidaste tu contrasena?
                                </button>
                            </div>
                            <Input
                                id="login-password"
                                type="password"
                                placeholder="Ingresa tu contrasena"
                                autoComplete="current-password"
                                aria-invalid={!!errors.password}
                                aria-describedby={
                                    errors.password
                                        ? "login-password-error"
                                        : undefined
                                }
                                {...register("password")}
                            />
                            {errors.password && (
                                <p
                                    id="login-password-error"
                                    className="text-sm text-destructive"
                                    role="alert"
                                >
                                    {errors.password.message}
                                </p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pt-2">
                        <Button
                            id="login-submit"
                            type="submit"
                            className="w-full"
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <LogIn className="h-4 w-4" aria-hidden="true" />
                            )}
                            {loginMutation.isPending
                                ? "Ingresando..."
                                : "Ingresar"}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            No tienes cuenta?{" "}
                            <Link
                                href="/register"
                                className="font-medium text-primary underline-offset-4 hover:underline"
                            >
                                Crear cuenta
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>

            {/* 2FA Dialog — opens automatically when backend returns twoFactorRequired */}
            <TwoFactorDialog
                open={twoFactorPending}
                twoFactorToken={twoFactorToken}
                isPending={twoFactorMutation.isPending}
                onSubmit={(code: string) => {
                    if (!twoFactorToken) return;
                    twoFactorMutation.mutate({
                        twoFactorToken,
                        code,
                    });
                }}
                onCancel={clearTwoFactorPending}
            />
        </>
    );
}
