"use client";

/**
 * Profile page — tabbed layout for managing user account.
 *
 * Tabs:
 * 1. Datos Personales (ProfileInfoForm)
 * 2. Seguridad (SecuritySection — password + 2FA)
 * 3. Configuracion (SettingsSection — theme + notifications + danger zone)
 *
 * Protected: wrapped by (protected)/layout.tsx AuthGuard.
 *
 * @route /profile
 */

import { ProfileInfoForm } from "@/components/features/profile/ProfileInfoForm";
import { SecuritySection } from "@/components/features/profile/SecuritySection";
import { SettingsSection } from "@/components/features/profile/SettingsSection";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { useProfile } from "@/hooks/features/auth";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

/** Extract initials from a full name (max 2 chars) */
function getInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
        parts[0].charAt(0).toUpperCase() +
        parts[parts.length - 1].charAt(0).toUpperCase()
    );
}

export default function ProfilePage() {
    const { user } = useAuthStore();
    const { isLoading: isProfileLoading } = useProfile();

    if (isProfileLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2
                    className="h-8 w-8 animate-spin text-muted-foreground"
                    aria-label="Cargando perfil"
                />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            {/* ── Header ──────────────────────────────────────── */}
            <div className="flex items-center gap-4">
                <Avatar size="lg">
                    <AvatarFallback className="text-lg">
                        {getInitials(user?.fullName ?? "Usuario")}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {user?.fullName ?? "Mi perfil"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {user?.email ??
                            "Gestiona tu cuenta y preferencias"}
                    </p>
                </div>
            </div>

            <Separator className="my-6" />

            {/* ── Tabs ────────────────────────────────────────── */}
            <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personal">
                        Datos personales
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        Seguridad
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        Configuracion
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="personal"
                    className="mt-6 focus-visible:outline-none"
                >
                    <ProfileInfoForm />
                </TabsContent>

                <TabsContent
                    value="security"
                    className="mt-6 focus-visible:outline-none"
                >
                    <SecuritySection />
                </TabsContent>

                <TabsContent
                    value="settings"
                    className="mt-6 focus-visible:outline-none"
                >
                    <SettingsSection />
                </TabsContent>
            </Tabs>
        </div>
    );
}
