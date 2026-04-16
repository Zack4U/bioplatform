/**
 * Auth layout — centered card layout without Navbar/Footer.
 * Used for /login, /register, and other auth-related pages.
 */

import { Leaf } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
            {/* Logo */}
            <Link
                href="/"
                className="mb-8 flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="BioCommerce Caldas - Inicio"
            >
                <Leaf
                    className="h-8 w-8 text-primary"
                    aria-hidden="true"
                />
                <span className="text-2xl font-bold tracking-tight">
                    Bio<span className="text-primary">Commerce</span>
                </span>
            </Link>

            {/* Page content */}
            <div className="w-full max-w-md">{children}</div>

            {/* Footer link */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
                <Link
                    href="/"
                    className="underline-offset-4 hover:underline"
                >
                    Volver al inicio
                </Link>
            </p>
        </div>
    );
}
