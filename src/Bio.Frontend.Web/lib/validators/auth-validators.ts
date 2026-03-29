/**
 * Zod validation schemas for authentication forms.
 *
 * Used with React Hook Form via @hookform/resolvers/zod.
 * Mirrors backend FluentValidation / DataAnnotation rules.
 */

import { z } from "zod";

/** Login form schema */
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, "El correo es obligatorio")
        .email("Formato de correo invalido"),
    password: z.string().min(1, "La contrasena es obligatoria"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/** Registration form schema — mirrors UserCreateDTO validations */
export const registerSchema = z.object({
    fullName: z
        .string()
        .min(1, "El nombre completo es obligatorio")
        .max(150, "El nombre no puede superar 150 caracteres"),
    email: z
        .string()
        .min(1, "El correo es obligatorio")
        .email("Formato de correo invalido")
        .max(100, "El correo no puede superar 100 caracteres"),
    phoneNumber: z
        .string()
        .min(1, "El telefono es obligatorio")
        .max(20, "El telefono no puede superar 20 caracteres"),
    password: z
        .string()
        .min(8, "La contrasena debe tener al menos 8 caracteres"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

/** Change password form schema — mirrors ChangePasswordRequestDTO */
export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "La contrasena actual es obligatoria"),
        newPassword: z
            .string()
            .min(8, "La nueva contrasena debe tener al menos 8 caracteres"),
        confirmNewPassword: z
            .string()
            .min(1, "La confirmacion es obligatoria"),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Las contrasenas no coinciden",
        path: ["confirmNewPassword"],
    });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

/** Profile update form schema — mirrors UserUpdateDTO */
export const updateProfileSchema = z.object({
    fullName: z
        .string()
        .min(1, "El nombre completo es obligatorio")
        .max(150, "El nombre no puede superar 150 caracteres"),
    email: z
        .string()
        .min(1, "El correo es obligatorio")
        .email("Formato de correo invalido")
        .max(100, "El correo no puede superar 100 caracteres"),
    phoneNumber: z
        .string()
        .min(1, "El telefono es obligatorio")
        .max(20, "El telefono no puede superar 20 caracteres"),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

/** 2FA code schema */
export const twoFactorCodeSchema = z.object({
    code: z
        .string()
        .min(6, "El codigo debe tener 6 digitos")
        .max(6, "El codigo debe tener 6 digitos")
        .regex(/^\d{6}$/, "Solo se permiten digitos"),
});

export type TwoFactorCodeFormValues = z.infer<typeof twoFactorCodeSchema>;
