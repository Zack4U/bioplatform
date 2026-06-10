"use client";

/**
 * AdminHeader — top bar for admin panel.
 *
 * Profile avatar button behavior:
 *   - Desktop (md+) → DropdownMenu (floating popover)
 *   - Mobile        → Drawer (bottom sheet)
 *
 * @module components/features/admin/layout/AdminHeader
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useIsMd } from "@/hooks/useMediaQuery";
import { useAdminLayoutStore } from "@/store/admin-layout-store";
import { useAuthStore } from "@/store/auth-store";
import { House, LogOut, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const BREADCRUMB_LABELS: Record<string, string> = {
    admin: "Panel de Administracion",
    users: "Usuarios",
    species: "Especies",
    images: "Imagenes",
    products: "Productos",
    orders: "Ordenes",
    reviews: "Resenas",
    permits: "Permisos ABS",
    requests: "Solicitudes",
    "ai-model": "Modelo CNN",
    chatbot: "Chatbot RAG",
    "audit-log": "Registro de Auditoria",
};

export function AdminHeader() {
    const { openMobileSidebar, toggleSidebar } = useAdminLayoutStore();
    const { user, logout } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();
    const isDesktop = useIsMd();
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((seg, idx) => ({
        label: BREADCRUMB_LABELS[seg] ?? seg,
        href: idx < segments.length - 1
            ? `/${segments.slice(0, idx + 1).join("/")}`
            : undefined,
    }));

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const initials = user?.fullName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() ?? "U";

    return (
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
            {/* Mobile sidebar toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={openMobileSidebar}
                aria-label="Abrir menu"
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop sidebar toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={toggleSidebar}
                aria-label="Toggle menu"
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-sm">
                {breadcrumbs.map((crumb, idx) => (
                    <span key={crumb.label} className="flex items-center gap-1.5">
                        {idx > 0 && <Separator orientation="vertical" className="h-4" />}
                        {crumb.href ? (
                            <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                                {crumb.label}
                            </Link>
                        ) : (
                            <span className="font-medium text-foreground">{crumb.label}</span>
                        )}
                    </span>
                ))}
            </nav>

            <div className="flex-1" />

            {/* Theme switcher — mirrors the public navbar toggle */}
            <ThemeToggle />

            {/* ── Profile: DropdownMenu on desktop, Drawer on mobile ── */}
            {isDesktop ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            aria-label="Menu de usuario"
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="flex flex-col gap-0.5">
                            <span className="font-medium text-sm">{user?.fullName}</span>
                            <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                                <User className="h-4 w-4" aria-hidden="true" />Mi Perfil
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                                <Settings className="h-4 w-4" aria-hidden="true" />Configuracion
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/" className="flex items-center gap-2 cursor-pointer">
                                <House className="h-4 w-4" aria-hidden="true" />Ir al comercio
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer gap-2"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" aria-hidden="true" />Cerrar Sesion
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => setProfileDrawerOpen(true)}
                        aria-label="Menu de usuario"
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>

                    <Drawer open={profileDrawerOpen} onOpenChange={setProfileDrawerOpen}>
                        <DrawerContent>
                            <DrawerHeader className="text-left">
                                <div className="flex items-center gap-3 mb-1">
                                    <Avatar>
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <DrawerTitle className="text-base leading-tight">{user?.fullName}</DrawerTitle>
                                        <DrawerDescription className="text-xs mt-0.5">{user?.email}</DrawerDescription>
                                    </div>
                                </div>
                            </DrawerHeader>
                            <Separator />
                            <nav className="flex flex-col gap-1 px-4 py-3">
                                <DrawerClose asChild>
                                    <Button variant="ghost" className="w-full justify-start" asChild>
                                        <Link href="/profile">
                                            <User className="mr-2 h-4 w-4" aria-hidden="true" />Mi Perfil
                                        </Link>
                                    </Button>
                                </DrawerClose>
                                <DrawerClose asChild>
                                    <Button variant="ghost" className="w-full justify-start" asChild>
                                        <Link href="/settings">
                                            <Settings className="mr-2 h-4 w-4" aria-hidden="true" />Configuracion
                                        </Link>
                                    </Button>
                                </DrawerClose>
                                <DrawerClose asChild>
                                    <Button variant="ghost" className="w-full justify-start" asChild>
                                        <Link href="/">
                                            <House className="mr-2 h-4 w-4" aria-hidden="true" />Ir al comercio
                                        </Link>
                                    </Button>
                                </DrawerClose>
                                <Separator className="my-1" />
                                <DrawerClose asChild>
                                    <Button
                                        variant="destructive"
                                        className="w-full justify-start"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />Cerrar Sesion
                                    </Button>
                                </DrawerClose>
                            </nav>
                        </DrawerContent>
                    </Drawer>
                </>
            )}
        </header>
    );
}
