"use client";

/**
 * Navbar — main application navigation bar.
 * Built on Shadcn Button + Sheet + DropdownMenu + Avatar primitives.
 * Shows user avatar menu when authenticated, login button when guest.
 * WCAG: skip navigation link, landmark nav, keyboard accessible.
 * Responsive: uses Sheet for mobile navigation drawer.
 */

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useLogout } from "@/hooks/features/auth";
import { useHydration } from "@/hooks/useHydration";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import {
    Leaf,
    LogOut,
    Menu,
    Settings,
    ShoppingCart,
    User,
} from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
    { label: "Catalogo", href: "/catalog" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Identificacion IA", href: "/identify" },
    { label: "Asesor IA", href: "/advisor" },
] as const;

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

export function Navbar() {
    const { isAuthenticated, user, isLoading } = useAuthStore();
    const logoutMutation = useLogout();
    const isHydrated = useHydration();
    const totalItems = useCartStore((s) => s.totalItems);
    const cartCount = isHydrated ? totalItems() : 0;

    return (
        <>
            {/* Skip navigation — WCAG 2.1 AA */}
            <a href="#main-content" className="skip-nav">
                Ir al contenido principal
            </a>

            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        aria-label="BioCommerce Caldas - Inicio"
                    >
                        <Leaf
                            className="h-7 w-7 text-primary"
                            aria-hidden="true"
                        />
                        <span className="text-lg font-bold tracking-tight">
                            Bio<span className="text-primary">Commerce</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav
                        aria-label="Navegacion principal"
                        className="hidden items-center gap-1 md:flex"
                    >
                        {NAV_LINKS.map((link) => (
                            <Button
                                key={link.href}
                                variant="ghost"
                                size="sm"
                                asChild
                            >
                                <Link href={link.href}>{link.label}</Link>
                            </Button>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />

                        <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Carrito de compras: ${cartCount} artículo${cartCount !== 1 ? "s" : ""}`}
                            asChild
                            className="relative"
                        >
                            <Link href="/cart">
                                <ShoppingCart
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {cartCount > 99 ? "99+" : cartCount}
                                    </span>
                                )}
                            </Link>
                        </Button>

                        {/* Auth state — show user menu or login button */}
                        {!isLoading && isAuthenticated && user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        id="user-menu-trigger"
                                        variant="outline"
                                        size="icon"
                                        aria-label="Menu de usuario"
                                    >
                                        <User
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56"
                                >
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex items-center gap-3">
                                            <Avatar size="sm">
                                                <AvatarFallback>
                                                    {getInitials(
                                                        user.fullName,
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {user.fullName}
                                                </p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile">
                                            <User
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                            Mi perfil
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings">
                                            <Settings
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                            Configuracion
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        id="logout-button"
                                        variant="destructive"
                                        onClick={() =>
                                            logoutMutation.mutate()
                                        }
                                        disabled={logoutMutation.isPending}
                                    >
                                        <LogOut
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        Cerrar sesion
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                id="login-nav-button"
                                size="sm"
                                className="hidden sm:inline-flex"
                                asChild
                            >
                                <Link href="/login">Ingresar</Link>
                            </Button>
                        )}

                        {/* Mobile menu — Sheet */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="md:hidden"
                                    aria-label="Abrir menu de navegacion"
                                >
                                    <Menu
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-72">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2">
                                        <Leaf
                                            className="h-5 w-5 text-primary"
                                            aria-hidden="true"
                                        />
                                        BioCommerce
                                    </SheetTitle>
                                    <SheetDescription>
                                        Navegacion principal
                                    </SheetDescription>
                                </SheetHeader>
                                <Separator />

                                {/* User info in mobile menu */}
                                {!isLoading && isAuthenticated && user && (
                                    <>
                                        <div className="flex items-center gap-3 px-2 py-3">
                                            <Avatar size="default">
                                                <AvatarFallback>
                                                    {getInitials(
                                                        user.fullName,
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <p className="text-sm font-medium leading-none">
                                                    {user.fullName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <Separator />
                                    </>
                                )}

                                <nav
                                    aria-label="Navegacion movil"
                                    className="flex flex-col gap-1 px-2"
                                >
                                    {NAV_LINKS.map((link) => (
                                        <SheetClose key={link.href} asChild>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                asChild
                                            >
                                                <Link href={link.href}>
                                                    {link.label}
                                                </Link>
                                            </Button>
                                        </SheetClose>
                                    ))}
                                    <Separator className="my-2" />

                                    {!isLoading &&
                                    isAuthenticated &&
                                    user ? (
                                        <>
                                            <SheetClose asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start"
                                                    asChild
                                                >
                                                    <Link href="/profile">
                                                        <User
                                                            className="mr-2 h-4 w-4"
                                                            aria-hidden="true"
                                                        />
                                                        Mi perfil
                                                    </Link>
                                                </Button>
                                            </SheetClose>
                                            <SheetClose asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start"
                                                    asChild
                                                >
                                                    <Link href="/settings">
                                                        <Settings
                                                            className="mr-2 h-4 w-4"
                                                            aria-hidden="true"
                                                        />
                                                        Configuracion
                                                    </Link>
                                                </Button>
                                            </SheetClose>
                                            <Separator className="my-2" />
                                            <SheetClose asChild>
                                                <Button
                                                    variant="destructive"
                                                    className="w-full justify-start"
                                                    onClick={() =>
                                                        logoutMutation.mutate()
                                                    }
                                                    disabled={
                                                        logoutMutation.isPending
                                                    }
                                                >
                                                    <LogOut
                                                        className="mr-2 h-4 w-4"
                                                        aria-hidden="true"
                                                    />
                                                    Cerrar sesion
                                                </Button>
                                            </SheetClose>
                                        </>
                                    ) : (
                                        <SheetClose asChild>
                                            <Button
                                                className="w-full"
                                                asChild
                                            >
                                                <Link href="/login">
                                                    Ingresar
                                                </Link>
                                            </Button>
                                        </SheetClose>
                                    )}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
        </>
    );
}
