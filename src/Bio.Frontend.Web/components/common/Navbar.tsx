"use client";

/**
 * Navbar — main application navigation bar.
 * Built on Shadcn Button + Sheet primitives.
 * WCAG: skip navigation link, landmark nav, keyboard accessible.
 * Responsive: uses Sheet for mobile navigation drawer.
 */

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
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
import { Leaf, Menu, ShoppingCart } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
    { label: "Catálogo", href: "/catalog" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Identificación IA", href: "/identify" },
    { label: "Asesor IA", href: "/advisor" },
] as const;

export function Navbar() {
    return (
        <>
            {/* Skip navigation — WCAG 2.1 AA */}
            <a href="#main-content" className="skip-nav">
                Ir al contenido principal
            </a>

            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        aria-label="BioCommerce Caldas — Inicio"
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
                        aria-label="Navegación principal"
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
                            aria-label="Carrito de compras"
                            asChild
                        >
                            <Link href="/cart">
                                <ShoppingCart
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            </Link>
                        </Button>

                        <Button
                            size="sm"
                            className="hidden sm:inline-flex"
                            asChild
                        >
                            <Link href="/login">Ingresar</Link>
                        </Button>

                        {/* Mobile menu — Sheet */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="md:hidden"
                                    aria-label="Abrir menú de navegación"
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
                                        Navegación principal
                                    </SheetDescription>
                                </SheetHeader>
                                <Separator />
                                <nav
                                    aria-label="Navegación móvil"
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
                                    <SheetClose asChild>
                                        <Button className="w-full" asChild>
                                            <Link href="/login">Ingresar</Link>
                                        </Button>
                                    </SheetClose>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
        </>
    );
}
