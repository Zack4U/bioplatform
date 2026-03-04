import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowRight,
    Bot,
    Camera,
    Leaf,
    MapPin,
    Search,
    Shield,
    ShoppingBag,
} from "lucide-react";
import Link from "next/link";

const FEATURES = [
    {
        icon: Search,
        title: "Catálogo de Biodiversidad",
        description:
            "Explora más de 1,000 especies de flora, fauna y hongos de Caldas con fichas científicas detalladas y mapas de distribución.",
        href: "/catalog",
    },
    {
        icon: Camera,
        title: "Identificación con IA",
        description:
            "Sube una fotografía y nuestro modelo de visión por computadora identificará la especie con información taxonómica completa.",
        href: "/identify",
    },
    {
        icon: ShoppingBag,
        title: "Marketplace Sostenible",
        description:
            "Conecta con productos de biocomercio verificados: ingredientes naturales, artesanías y experiencias de ecoturismo.",
        href: "/marketplace",
    },
    {
        icon: Bot,
        title: "Asesor de Biocomercio IA",
        description:
            "Genera planes de negocio, análisis de mercado y estrategias de comercialización con nuestro asistente de IA generativa.",
        href: "/advisor",
    },
    {
        icon: MapPin,
        title: "Mapas de Distribución",
        description:
            "Visualiza la distribución geográfica de especies en los municipios de Caldas con datos de georreferenciación.",
        href: "/catalog",
    },
    {
        icon: Shield,
        title: "Cumplimiento Legal",
        description:
            "Gestión de permisos ABS (Protocolo de Nagoya), trazabilidad de origen y certificaciones de sostenibilidad integradas.",
        href: "/legal/abs",
    },
] as const;

const STATS = [
    { value: "1,000+", label: "Especies registradas" },
    { value: "300+", label: "Especies identificables por IA" },
    { value: "27", label: "Municipios de Caldas" },
    { value: "85%+", label: "Precisión del modelo" },
] as const;

export default function HomePage() {
    return (
        <div className="flex flex-col">
            {/* ─── Hero Section ─────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
                <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
                    <div className="mx-auto max-w-3xl text-center">
                        <Badge
                            variant="outline"
                            className="mb-6 gap-2 px-4 py-1.5 text-sm shadow-sm"
                        >
                            <Leaf
                                className="h-4 w-4 text-primary"
                                aria-hidden="true"
                            />
                            Plataforma de Biodiversidad de Caldas
                        </Badge>

                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                            Descubre, conserva y{" "}
                            <span className="text-primary">comercializa</span>{" "}
                            la biodiversidad
                        </h1>

                        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
                            Conectamos investigadores, emprendedores y
                            comunidades locales para el aprovechamiento
                            sostenible de la riqueza natural de Caldas,
                            Colombia.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Button size="lg" asChild>
                                <Link href="/catalog">
                                    Explorar Catálogo
                                    <ArrowRight
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" asChild>
                                <Link href="/identify">
                                    <Camera
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Identificar Especie
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Decorative gradient blob */}
                <div
                    className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 opacity-20"
                    aria-hidden="true"
                >
                    <div className="h-[500px] w-[700px] rounded-full bg-primary/30 blur-3xl" />
                </div>
            </section>

            {/* ─── Stats Bar ────────────────────────────────────────────── */}
            <section className="border-y bg-muted/30" aria-label="Estadísticas">
                <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <p className="text-2xl font-bold text-primary sm:text-3xl">
                                {stat.value}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Features Grid ────────────────────────────────────────── */}
            <section
                className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
                aria-labelledby="features-heading"
            >
                <div className="mx-auto max-w-2xl text-center">
                    <h2
                        id="features-heading"
                        className="text-3xl font-bold tracking-tight"
                    >
                        Todo lo que necesitas para el biocomercio
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                        Una plataforma completa que integra ciencia, tecnología
                        y comercio sostenible para la biodiversidad de Caldas.
                    </p>
                </div>

                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <Link
                                key={feature.title}
                                href={feature.href}
                                className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                                <Card className="h-full transition-all group-hover:border-primary/30 group-hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                                            <Icon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <CardTitle className="text-base">
                                            {feature.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* ─── CTA Section ──────────────────────────────────────────── */}
            <section className="border-t bg-primary/5">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            ¿Listo para explorar la biodiversidad de Caldas?
                        </h2>
                        <p className="mt-3 text-muted-foreground">
                            Regístrate y accede al catálogo completo,
                            marketplace y herramientas de inteligencia
                            artificial.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Button size="lg" asChild>
                                <Link href="/register">
                                    Crear Cuenta Gratis
                                    <ArrowRight
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" asChild>
                                <Link href="/about">Conocer Más</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
