"use client";

/**
 * Navbar — main application navigation bar.
 *
 * Profile/user button behavior:
 *   - Desktop (md+) → DropdownMenu (floating popover, as before)
 *   - Mobile        → Drawer (bottom sheet)
 *
 * Uses useIsMd() from the global useMediaQuery hook so the responsive
 * behaviour is consistent with the rest of the application.
 *
 * Mobile hamburger uses a Sheet for page navigation (unchanged).
 * WCAG: skip navigation link, landmark nav, keyboard accessible.
 */

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { NotificationBell } from "@/components/features/community/NotificationBell";
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
import { useIsMd } from "@/hooks/useMediaQuery";
import { ADMIN_ROLES } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import {
    Heart, LayoutDashboard, Leaf, LogOut, MapPin, Menu, Settings, ShoppingCart, User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";


const NAV_LINKS = [
    { label: "Catalogo", href: "/catalog" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Comunidad", href: "/community" },
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
    const pathname = usePathname();
    const { isAuthenticated, user, isLoading } = useAuthStore();
    const logoutMutation = useLogout();
    const isHydrated = useHydration();
    const isDesktop = useIsMd();

    const cartCountValue = useCartStore((s) =>
        s.items.reduce((sum, item) => sum + item.quantity, 0),
    );
    const cartCount = isHydrated ? cartCountValue : 0;

    const hasAdminAccess =
        isAuthenticated &&
        user?.roles?.some((role) =>
            (ADMIN_ROLES as readonly string[]).includes(role),
        );

    /** Hide the public Navbar inside the admin panel */
    if (pathname.startsWith("/admin")) return null;



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
                        <Leaf className="h-7 w-7 text-primary" aria-hidden="true" />
                        <span className="text-lg font-bold tracking-tight">
                            Bio<span className="text-primary">Commerce</span>
                        </span>
                    </Link>

                    {/* Desktop nav links */}
                    <nav aria-label="Navegacion principal" className="hidden items-center gap-1 md:flex">
                        {NAV_LINKS.map((link) => (
                            <Button key={link.href} variant="ghost" size="sm" asChild>
                                <Link href={link.href}>{link.label}</Link>
                            </Button>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />

                        {/* Notification Bell — only for authenticated users */}
                        {!isLoading && isAuthenticated && (
                            <NotificationBell />
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Carrito de compras: ${cartCount} artículo${cartCount !== 1 ? "s" : ""}`}
                            asChild
                            className="relative"
                        >
                            <Link href="/cart">
                                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {cartCount > 99 ? "99+" : cartCount}
                                    </span>
                                )}
                            </Link>
                        </Button>

                        {/* ── Profile: DropdownMenu on desktop only ── */}
                        {!isLoading && isAuthenticated && user && isDesktop && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        id="user-menu-trigger"
                                        variant="ghost"
                                        className="relative h-9 w-9 rounded-full"
                                        aria-label="Menu de usuario"
                                    >
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                                {getInitials(user.fullName)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="flex flex-col gap-0.5">
                                        <span className="font-medium text-sm">{user.fullName}</span>
                                        <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                                            <User className="h-4 w-4" aria-hidden="true" />
                                            Mi perfil
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile?tab=addresses" className="flex items-center gap-2 cursor-pointer">
                                            <MapPin className="h-4 w-4" aria-hidden="true" />
                                            Direcciones
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile?tab=favorites" className="flex items-center gap-2 cursor-pointer">
                                            <Heart className="h-4 w-4" aria-hidden="true" />
                                            Favoritos
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile?tab=settings" className="flex items-center gap-2 cursor-pointer">
                                            <Settings className="h-4 w-4" aria-hidden="true" />
                                            Configuracion
                                        </Link>
                                    </DropdownMenuItem>
                                    {hasAdminAccess && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                                                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                                                    Panel de Administracion
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        id="logout-button"
                                        className="text-destructive focus:text-destructive cursor-pointer gap-2"
                                        onClick={() => logoutMutation.mutate()}
                                        disabled={logoutMutation.isPending}
                                    >
                                        <LogOut className="h-4 w-4" aria-hidden="true" />
                                        Cerrar sesion
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {!isLoading && (!isAuthenticated || !user) && (
                            <Button id="login-nav-button" size="sm" className="hidden sm:inline-flex" asChild>
                                <Link href="/login">Ingresar</Link>
                            </Button>
                        )}

                        {/* Mobile hamburger — Sheet for page navigation */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="md:hidden"
                                    aria-label="Abrir menu de navegacion"
                                >
                                    <Menu className="h-4 w-4" aria-hidden="true" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-72">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2">
                                        <Leaf className="h-5 w-5 text-primary" aria-hidden="true" />
                                        BioCommerce
                                    </SheetTitle>
                                    <SheetDescription>Navegacion principal</SheetDescription>
                                </SheetHeader>
                                <Separator />
                                {!isLoading && isAuthenticated && user && (
                                    <>
                                        <div className="flex items-center gap-3 px-2 py-3">
                                            <Avatar>
                                                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                                <p className="text-sm font-medium leading-none truncate">{user.fullName}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <Separator />
                                    </>
                                )}
                                <nav aria-label="Navegacion movil" className="flex flex-col gap-1 px-2 py-2">
                                    {NAV_LINKS.map((link) => (
                                        <SheetClose key={link.href} asChild>
                                            <Button variant="ghost" className="w-full justify-start" asChild>
                                                <Link href={link.href}>{link.label}</Link>
                                            </Button>
                                        </SheetClose>
                                    ))}
                                    <Separator className="my-2" />
                                    {!isLoading && isAuthenticated && user ? (
                                        <>
                                            <SheetClose asChild>
                                                <Button variant="ghost" className="w-full justify-start" asChild>
                                                    <Link href="/profile"><User className="mr-2 h-4 w-4" />Mi perfil</Link>
                                                </Button>
                                            </SheetClose>
                                            <SheetClose asChild>
                                                <Button variant="ghost" className="w-full justify-start" asChild>
                                                    <Link href="/profile?tab=addresses"><MapPin className="mr-2 h-4 w-4" />Direcciones</Link>
                                                </Button>
                                            </SheetClose>
                                            <SheetClose asChild>
                                                <Button variant="ghost" className="w-full justify-start" asChild>
                                                    <Link href="/profile?tab=favorites"><Heart className="mr-2 h-4 w-4" />Favoritos</Link>
                                                </Button>
                                            </SheetClose>
                                            <SheetClose asChild>
                                                <Button variant="ghost" className="w-full justify-start" asChild>
                                                    <Link href="/profile?tab=settings"><Settings className="mr-2 h-4 w-4" />Configuracion</Link>
                                                </Button>
                                            </SheetClose>
                                            {hasAdminAccess && (
                                                <SheetClose asChild>
                                                    <Button variant="ghost" className="w-full justify-start" asChild>
                                                        <Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Panel de Administracion</Link>
                                                    </Button>
                                                </SheetClose>
                                            )}
                                            <Separator className="my-2" />
                                            <SheetClose asChild>
                                                <Button
                                                    variant="destructive"
                                                    className="w-full justify-start"
                                                    onClick={() => logoutMutation.mutate()}
                                                    disabled={logoutMutation.isPending}
                                                >
                                                    <LogOut className="mr-2 h-4 w-4" />Cerrar sesion
                                                </Button>
                                            </SheetClose>
                                        </>
                                    ) : (
                                        <SheetClose asChild>
                                            <Button className="w-full" asChild>
                                                <Link href="/login">Ingresar</Link>
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
