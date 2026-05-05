"use client";

/**
 * AdminHeader — top bar for admin panel.
 * Shows sidebar toggle, breadcrumbs, and user actions.
 *
 * @module components/features/admin/layout/AdminHeader
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAdminLayoutStore } from "@/store/admin-layout-store";
import { useAuthStore } from "@/store/auth-store";
import { LogOut, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/** Map pathname segments to breadcrumb labels */
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

    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((seg, idx) => ({
        label: BREADCRUMB_LABELS[seg] ?? seg,
        href: idx < segments.length - 1 ? `/${segments.slice(0, idx + 1).join("/")}` : undefined,
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
            {/* Mobile toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={openMobileSidebar}
                aria-label="Abrir menu"
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop toggle */}
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
                        {idx > 0 && (
                            <Separator orientation="vertical" className="h-4" />
                        )}
                        {crumb.href ? (
                            <Link
                                href={crumb.href}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span className="font-medium text-foreground">
                                {crumb.label}
                            </span>
                        )}
                    </span>
                ))}
            </nav>

            <div className="flex-1" />

            {/* User dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <p className="text-sm font-medium">{user?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/profile">
                            <User className="mr-2 h-4 w-4" />
                            Mi Perfil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Configuracion
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesion
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
