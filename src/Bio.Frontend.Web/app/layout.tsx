import { Footer } from "@/components/common/Footer";
import { Navbar } from "@/components/common/Navbar";
import { Providers } from "@/providers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "BioCommerce Caldas — Biodiversidad y Biocomercio",
        template: "%s | BioCommerce Caldas",
    },
    description:
        "Plataforma digital de biodiversidad y biocomercio para Caldas, Colombia. Catálogo de especies, marketplace sostenible e identificación con IA.",
    keywords: [
        "biodiversidad",
        "biocomercio",
        "Caldas",
        "Colombia",
        "especies",
        "marketplace",
        "sostenibilidad",
        "IA",
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
            >
                <Providers>
                    <div className="flex min-h-screen flex-col">
                        <Navbar />
                        <main
                            id="main-content"
                            className="flex-1"
                            tabIndex={-1}
                        >
                            {children}
                        </main>
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    );
}
