"use client";

/**
 * Footer — application footer with links and copyright.
 * Built on Shadcn Separator primitive.
 * WCAG: landmark, proper link text, language consistency.
 */

import { Separator } from "@/components/ui/separator";
import { Leaf } from "lucide-react";
import Link from "next/link";

const FOOTER_SECTIONS = [
    {
        title: "Plataforma",
        links: [
            { label: "Catálogo de Especies", href: "/catalog" },
            { label: "Marketplace", href: "/marketplace" },
            { label: "Identificación IA", href: "/identify" },
            { label: "Asesor de Biocomercio", href: "/advisor" },
        ],
    },
    {
        title: "Recursos",
        links: [
            { label: "Documentación API", href: "/docs/api" },
            { label: "Acerca del Proyecto", href: "/about" },
            { label: "Protocolo de Nagoya", href: "/legal/nagoya" },
            { label: "Contacto", href: "/contact" },
        ],
    },
    {
        title: "Legal",
        links: [
            { label: "Términos de Servicio", href: "/legal/terms" },
            { label: "Política de Privacidad", href: "/legal/privacy" },
            { label: "Acceso a Recursos Genéticos", href: "/legal/abs" },
        ],
    },
] as const;

export function Footer() {
    return (
        <footer className="border-t bg-muted/30" aria-label="Pie de página">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            aria-label="BioCommerce Caldas — Inicio"
                        >
                            <Leaf
                                className="h-6 w-6 text-primary"
                                aria-hidden="true"
                            />
                            <span className="text-base font-bold">
                                Bio
                                <span className="text-primary">Commerce</span>
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Plataforma de biodiversidad y biocomercio para
                            Caldas, Colombia. Conectando ciencia, comunidad y
                            sostenibilidad.
                        </p>
                    </div>

                    {/* Link sections */}
                    {FOOTER_SECTIONS.map((section) => (
                        <div key={section.title} className="space-y-3">
                            <h3 className="text-sm font-semibold">
                                {section.title}
                            </h3>
                            <ul className="space-y-2">
                                {section.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <Separator className="mt-10" />
                <div className="pt-6 text-center">
                    <p className="text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} BioCommerce Caldas.
                        Todos los derechos reservados. Proyecto académico de
                        biodiversidad y biocomercio.
                    </p>
                </div>
            </div>
        </footer>
    );
}
