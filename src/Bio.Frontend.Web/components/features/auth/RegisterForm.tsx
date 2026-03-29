"use client";

/**
 * RegisterForm — user registration form.
 *
 * Logic delegated to useRegister hook.
 * Uses React Hook Form + Zod for validation, Shadcn/ui for UI.
 *
 * @module components/features/auth/RegisterForm
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
import { useRegister } from "@/hooks/features/auth";
import {
    registerSchema,
    type RegisterFormValues,
} from "@/lib/validators/auth-validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

export function RegisterForm() {
    const registerMutation = useRegister();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phoneNumber: "",
            password: "",
        },
    });

    function onSubmit(values: RegisterFormValues) {
        registerMutation.mutate(values);
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                    Crear Cuenta
                </CardTitle>
                <CardDescription>
                    Registrate para acceder al marketplace de biodiversidad
                </CardDescription>
            </CardHeader>

            <form
                id="register-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
            >
                <CardContent className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="register-fullname">
                            Nombre completo
                        </Label>
                        <Input
                            id="register-fullname"
                            type="text"
                            placeholder="Tu nombre completo"
                            autoComplete="name"
                            aria-invalid={!!errors.fullName}
                            aria-describedby={
                                errors.fullName
                                    ? "register-fullname-error"
                                    : undefined
                            }
                            {...register("fullName")}
                        />
                        {errors.fullName && (
                            <p
                                id="register-fullname-error"
                                className="text-sm text-destructive"
                                role="alert"
                            >
                                {errors.fullName.message}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="register-email">
                            Correo electronico
                        </Label>
                        <Input
                            id="register-email"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            autoComplete="email"
                            aria-invalid={!!errors.email}
                            aria-describedby={
                                errors.email
                                    ? "register-email-error"
                                    : undefined
                            }
                            {...register("email")}
                        />
                        {errors.email && (
                            <p
                                id="register-email-error"
                                className="text-sm text-destructive"
                                role="alert"
                            >
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="register-phone">
                            Telefono
                        </Label>
                        <Input
                            id="register-phone"
                            type="tel"
                            placeholder="+57 300 000 0000"
                            autoComplete="tel"
                            aria-invalid={!!errors.phoneNumber}
                            aria-describedby={
                                errors.phoneNumber
                                    ? "register-phone-error"
                                    : undefined
                            }
                            {...register("phoneNumber")}
                        />
                        {errors.phoneNumber && (
                            <p
                                id="register-phone-error"
                                className="text-sm text-destructive"
                                role="alert"
                            >
                                {errors.phoneNumber.message}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="register-password">
                            Contrasena
                        </Label>
                        <Input
                            id="register-password"
                            type="password"
                            placeholder="Minimo 8 caracteres"
                            autoComplete="new-password"
                            aria-invalid={!!errors.password}
                            aria-describedby={
                                errors.password
                                    ? "register-password-error"
                                    : undefined
                            }
                            {...register("password")}
                        />
                        {errors.password && (
                            <p
                                id="register-password-error"
                                className="text-sm text-destructive"
                                role="alert"
                            >
                                {errors.password.message}
                            </p>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                    <Button
                        id="register-submit"
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? (
                            <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                            />
                        ) : (
                            <UserPlus
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                        )}
                        {registerMutation.isPending
                            ? "Creando cuenta..."
                            : "Crear cuenta"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Ya tienes cuenta?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                            Inicia sesion
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
