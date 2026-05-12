"use client";

/**
 * Profile page — tabbed layout for managing user account.
 *
 * Tabs:
 * 1. Datos Personales (ProfileInfoForm)
 * 2. Seguridad (SecuritySection — password + 2FA)
 * 3. Configuracion (SettingsSection — theme + notifications + danger zone)
 * 4. Direcciones (AddressBook)
 * 5. Favoritos (FavoritesGrid)
 * 6. Mis Reseñas (MyReviewsList)
 * 7. Permisos ABS (AbsPermitsSection — Entrepreneur/Authority only)
 *
 * Protected: wrapped by (protected)/layout.tsx AuthGuard.
 *
 * @route /profile
 */

import { AddressBook } from "@/components/features/profile/AddressBook";
import { FavoritesGrid } from "@/components/features/profile/FavoritesGrid";
import { MyReviewsList } from "@/components/features/profile/MyReviewsList";
import { ProfileInfoForm } from "@/components/features/profile/ProfileInfoForm";
import { SecuritySection } from "@/components/features/profile/SecuritySection";
import { SettingsSection } from "@/components/features/profile/SettingsSection";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { useSearchParams, useRouter, usePathname } from "next/navigation";

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

const ENTREPRENEUR_ROLES = ["ENTREPRENEUR", "AUTHORITY", "ADMIN"];

export default function ProfilePage() {
    const { user } = useAuthStore();
    const { isLoading: isProfileLoading } = useProfile();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    const currentTab = searchParams.get("tab") ?? "personal";

    const isEntrepreneur = user?.roles?.some((r) =>
        ENTREPRENEUR_ROLES.includes(r),
    );

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

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
                        {user?.email ?? "Gestiona tu cuenta y preferencias"}
                    </p>
                    {user?.roles && user.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                                <Badge key={role} variant="secondary" className="text-xs">
                                    {role}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Separator className="my-6" />

            {/* ── Tabs ────────────────────────────────────────── */}
            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
                    <TabsTrigger
                        value="personal"
                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        Datos personales
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        Seguridad
                    </TabsTrigger>
                    <TabsTrigger
                        value="addresses"
                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        Direcciones
                    </TabsTrigger>
                    <TabsTrigger
                        value="favorites"
                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        Favoritos
                    </TabsTrigger>
                    <TabsTrigger
                        value="reviews"
                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        Mis Reseñas
                    </TabsTrigger>
                    {isEntrepreneur && (
                        <TabsTrigger
                            value="permits"
                            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            Permisos ABS
                        </TabsTrigger>
                    )}
                    <TabsTrigger
                        value="settings"
                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        Configuracion
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-6 focus-visible:outline-none">
                    <ProfileInfoForm />
                </TabsContent>

                <TabsContent value="security" className="mt-6 focus-visible:outline-none">
                    <SecuritySection />
                </TabsContent>

                <TabsContent value="addresses" className="mt-6 focus-visible:outline-none">
                    <AddressBook />
                </TabsContent>

                <TabsContent value="favorites" className="mt-6 focus-visible:outline-none">
                    <FavoritesGrid />
                </TabsContent>

                <TabsContent value="reviews" className="mt-6 focus-visible:outline-none">
                    <MyReviewsList />
                </TabsContent>

                {isEntrepreneur && (
                    <TabsContent value="permits" className="mt-6 focus-visible:outline-none">
                        <p className="text-sm text-muted-foreground">
                            Seccion de permisos ABS disponible proxinamente.
                        </p>
                    </TabsContent>
                )}

                <TabsContent value="settings" className="mt-6 focus-visible:outline-none">
                    <SettingsSection />
                </TabsContent>
            </Tabs>
        </div>
    );
}

