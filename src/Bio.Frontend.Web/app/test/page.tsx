"use client";

/**
 * Test page — demonstrates theme toggle and Sonner toast notifications.
 * Access at /test to verify dark/light mode and all notification statuses.
 */

import {
    ConfirmDialog,
    DataCard,
    EmptyState,
    ErrorFallback,
    LoadingSpinner,
    PageHeader,
    Pagination,
    SearchInput,
    StatCard,
    StatusBadge,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { notificationService } from "@/lib/notifications";
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    Info,
    Leaf,
    Loader2,
    PackageSearch,
    Palette,
    XCircle,
} from "lucide-react";
import { useState } from "react";

export default function TestPage() {
    const [searchValue, setSearchValue] = useState("");
    const [currentPage, setCurrentPage] = useState(3);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [destructiveConfirmOpen, setDestructiveConfirmOpen] = useState(false);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                title="Página de Pruebas"
                description="Verifica el tema claro/oscuro, notificaciones Sonner y todos los componentes comunes de Shadcn/UI."
                breadcrumbs={[
                    { label: "Inicio", href: "/" },
                    { label: "Pruebas" },
                ]}
            />

            <div className="space-y-12">
                {/* ─── Section 1: Theme Toggle ──────────────────────────── */}
                <section aria-labelledby="theme-heading">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Palette
                                    className="h-5 w-5 text-primary"
                                    aria-hidden="true"
                                />
                                <CardTitle id="theme-heading">
                                    Tema Claro / Oscuro / Sistema
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Usa el selector de tema en el Navbar (esquina
                                superior derecha) para alternar entre modo
                                claro, oscuro y sistema. Los cambios se reflejan
                                en tiempo real en todos los componentes de esta
                                página.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-lg border bg-background p-4 text-center">
                                    <p className="text-sm font-medium">
                                        Background
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        bg-background
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-card p-4 text-center">
                                    <p className="text-sm font-medium text-card-foreground">
                                        Card
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        bg-card
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-muted p-4 text-center">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Muted
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        bg-muted
                                    </p>
                                </div>
                                <div className="rounded-lg bg-primary p-4 text-center">
                                    <p className="text-sm font-medium text-primary-foreground">
                                        Primary
                                    </p>
                                    <p className="text-xs text-primary-foreground/70">
                                        bg-primary
                                    </p>
                                </div>
                                <div className="rounded-lg bg-secondary p-4 text-center">
                                    <p className="text-sm font-medium text-secondary-foreground">
                                        Secondary
                                    </p>
                                    <p className="text-xs text-secondary-foreground/70">
                                        bg-secondary
                                    </p>
                                </div>
                                <div className="rounded-lg bg-accent p-4 text-center">
                                    <p className="text-sm font-medium text-accent-foreground">
                                        Accent
                                    </p>
                                    <p className="text-xs text-accent-foreground/70">
                                        bg-accent
                                    </p>
                                </div>
                                <div className="rounded-lg bg-destructive p-4 text-center">
                                    <p className="text-sm font-medium text-white">
                                        Destructive
                                    </p>
                                    <p className="text-xs text-white/70">
                                        bg-destructive
                                    </p>
                                </div>
                                <div className="rounded-lg bg-success/15 border-success/25 border p-4 text-center">
                                    <p className="text-sm font-medium text-success">
                                        Success
                                    </p>
                                    <p className="text-xs text-success/70">
                                        semantic
                                    </p>
                                </div>
                                <div className="rounded-lg bg-info/15 border-info/25 border p-4 text-center">
                                    <p className="text-sm font-medium text-info">
                                        Info
                                    </p>
                                    <p className="text-xs text-info/70">
                                        semantic
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Separator />

                {/* ─── Section 2: Sonner Notifications ──────────────────── */}
                <section aria-labelledby="sonner-heading">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Bell
                                    className="h-5 w-5 text-primary"
                                    aria-hidden="true"
                                />
                                <CardTitle id="sonner-heading">
                                    Notificaciones Sonner
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Haz clic en cada botón para probar los
                                diferentes estados de las notificaciones toast.
                                Aparecen en la esquina superior derecha.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    onClick={() =>
                                        notificationService.success(
                                            "Operación completada exitosamente",
                                            {
                                                description:
                                                    "Los datos se han guardado correctamente.",
                                            },
                                        )
                                    }
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <CheckCircle2
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Success
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={() =>
                                        notificationService.error(
                                            "Error al procesar",
                                            {
                                                description:
                                                    "No se pudo completar la operación. Intenta de nuevo.",
                                            },
                                        )
                                    }
                                >
                                    <XCircle
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Error
                                </Button>

                                <Button
                                    className="bg-amber-500 hover:bg-amber-600 text-white"
                                    onClick={() =>
                                        notificationService.warning(
                                            "Advertencia",
                                            {
                                                description:
                                                    "Tu sesión expirará en 5 minutos.",
                                            },
                                        )
                                    }
                                >
                                    <AlertTriangle
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Warning
                                </Button>

                                <Button
                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                    onClick={() =>
                                        notificationService.info(
                                            "Información",
                                            {
                                                description:
                                                    "Se encontraron 42 especies en tu búsqueda.",
                                            },
                                        )
                                    }
                                >
                                    <Info
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Info
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        notificationService.loading(
                                            "Procesando solicitud...",
                                        )
                                    }
                                >
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                    Loading
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        notificationService.promise(
                                            new Promise<string>((resolve) =>
                                                setTimeout(
                                                    () =>
                                                        resolve(
                                                            "Identificación completada",
                                                        ),
                                                    2500,
                                                ),
                                            ),
                                            {
                                                loading:
                                                    "Identificando especie...",
                                                success: (data) =>
                                                    `${data}: Quercus humboldtii`,
                                                error: "Error al identificar",
                                            },
                                        );
                                    }}
                                >
                                    <Leaf
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Promise (2.5s)
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() =>
                                        notificationService.dismiss()
                                    }
                                >
                                    Cerrar Todas
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Separator />

                {/* ─── Section 3: Button Variants ───────────────────────── */}
                <section aria-labelledby="buttons-heading">
                    <Card>
                        <CardHeader>
                            <CardTitle id="buttons-heading">
                                Variantes de Button
                            </CardTitle>
                            <CardDescription>
                                Todos los estilos disponibles del componente
                                Shadcn Button.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                <Button>Default</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="destructive">
                                    Destructive
                                </Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="link">Link</Button>
                                <Button disabled>Disabled</Button>
                                <Button size="sm">Small</Button>
                                <Button size="lg">Large</Button>
                                <Button size="icon" aria-label="Icono">
                                    <Leaf
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Separator />

                {/* ─── Section 4: Badge Variants ────────────────────────── */}
                <section aria-labelledby="badges-heading">
                    <Card>
                        <CardHeader>
                            <CardTitle id="badges-heading">
                                Badges & StatusBadge
                            </CardTitle>
                            <CardDescription>
                                Shadcn Badge primitivos y StatusBadge
                                semánticos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="mb-2 text-sm font-medium">
                                    Shadcn Badge:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Badge>Default</Badge>
                                    <Badge variant="secondary">Secondary</Badge>
                                    <Badge variant="destructive">
                                        Destructive
                                    </Badge>
                                    <Badge variant="outline">Outline</Badge>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <p className="mb-2 text-sm font-medium">
                                    StatusBadge (semánticos):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <StatusBadge
                                        label="Activo"
                                        variant="success"
                                    />
                                    <StatusBadge
                                        label="Pendiente"
                                        variant="warning"
                                    />
                                    <StatusBadge
                                        label="Cancelado"
                                        variant="destructive"
                                    />
                                    <StatusBadge
                                        label="Procesando"
                                        variant="info"
                                    />
                                    <StatusBadge
                                        label="Borrador"
                                        variant="default"
                                    />
                                    <StatusBadge
                                        label="Sin estado"
                                        variant="outline"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Separator />

                {/* ─── Section 5: SearchInput ───────────────────────────── */}
                <section aria-labelledby="search-heading">
                    <Card>
                        <CardHeader>
                            <CardTitle id="search-heading">
                                SearchInput
                            </CardTitle>
                            <CardDescription>
                                Campo de búsqueda con debounce de 300ms y botón
                                de limpiar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SearchInput
                                value={searchValue}
                                onChange={setSearchValue}
                                placeholder="Buscar especie, producto..."
                                className="max-w-md"
                            />
                            {searchValue && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Buscando: &quot;{searchValue}&quot;
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <Separator />

                {/* ─── Section 6: StatCards ──────────────────────────────── */}
                <section aria-labelledby="stats-heading">
                    <h2
                        id="stats-heading"
                        className="mb-4 text-lg font-semibold"
                    >
                        StatCards
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Especies Registradas"
                            value="1,247"
                            icon={
                                <Leaf className="h-5 w-5" aria-hidden="true" />
                            }
                            trend={{ value: 12.5, label: "vs mes anterior" }}
                        />
                        <StatCard
                            label="Productos Activos"
                            value="89"
                            icon={
                                <PackageSearch
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                />
                            }
                            trend={{ value: -3.2, label: "vs mes anterior" }}
                        />
                        <StatCard label="Usuarios" value="2,456" />
                        <StatCard
                            label="Identificaciones IA"
                            value="15,780"
                            trend={{ value: 28, label: "este mes" }}
                        />
                    </div>
                </section>

                <Separator />

                {/* ─── Section 7: DataCard ───────────────────────────────── */}
                <section aria-labelledby="datacards-heading">
                    <h2
                        id="datacards-heading"
                        className="mb-4 text-lg font-semibold"
                    >
                        DataCards
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <DataCard
                            title="Quercus humboldtii"
                            subtitle="Roble de tierra fría"
                            badge={
                                <StatusBadge
                                    label="Vulnerable"
                                    variant="warning"
                                />
                            }
                            footer={
                                <span className="text-muted-foreground">
                                    Fagaceae · Manizales, Caldas
                                </span>
                            }
                        >
                            <p className="text-xs text-muted-foreground">
                                Árbol nativo de los bosques andinos. Altura:
                                25-30m.
                            </p>
                        </DataCard>
                        <DataCard
                            title="Café Especial de Altura"
                            subtitle="Producto de biocomercio"
                            badge={
                                <StatusBadge label="Activo" variant="success" />
                            }
                            footer={
                                <span className="font-semibold text-primary">
                                    $45,000 COP / kg
                                </span>
                            }
                            href="#"
                        />
                        <DataCard
                            title="Palma de Cera del Quindío"
                            subtitle="Ceroxylon quindiuense"
                            badge={
                                <StatusBadge
                                    label="En Peligro"
                                    variant="destructive"
                                />
                            }
                        >
                            <p className="text-xs text-muted-foreground">
                                Árbol nacional de Colombia. Hasta 60m de altura.
                            </p>
                        </DataCard>
                    </div>
                </section>

                <Separator />

                {/* ─── Section 8: Pagination ─────────────────────────────── */}
                <section aria-labelledby="pagination-heading">
                    <Card>
                        <CardHeader>
                            <CardTitle id="pagination-heading">
                                Pagination
                            </CardTitle>
                            <CardDescription>
                                Página actual: {currentPage} de 15
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={15}
                                onPageChange={setCurrentPage}
                            />
                        </CardContent>
                    </Card>
                </section>

                <Separator />

                {/* ─── Section 9: States ─────────────────────────────────── */}
                <section aria-labelledby="states-heading">
                    <h2
                        id="states-heading"
                        className="mb-4 text-lg font-semibold"
                    >
                        Estados (Empty, Error, Loading)
                    </h2>
                    <div className="grid gap-6 lg:grid-cols-3">
                        <EmptyState
                            icon={
                                <PackageSearch
                                    className="h-8 w-8"
                                    aria-hidden="true"
                                />
                            }
                            title="No se encontraron resultados"
                            description="Intenta ajustar los filtros de búsqueda o explorar otra categoría."
                            action={
                                <Button variant="outline" size="sm">
                                    Limpiar Filtros
                                </Button>
                            }
                        />
                        <ErrorFallback
                            title="Error de conexión"
                            message="No se pudo conectar con el servidor. Verifica tu conexión a internet."
                            onRetry={() =>
                                notificationService.info("Reintentando...", {
                                    description: "Conectando con el servidor.",
                                })
                            }
                        />
                        <Card className="flex items-center justify-center p-12">
                            <LoadingSpinner
                                size="lg"
                                label="Cargando datos..."
                            />
                        </Card>
                    </div>
                </section>

                <Separator />

                {/* ─── Section 10: ConfirmDialog ─────────────────────────── */}
                <section aria-labelledby="dialog-heading">
                    <Card>
                        <CardHeader>
                            <CardTitle id="dialog-heading">
                                ConfirmDialog
                            </CardTitle>
                            <CardDescription>
                                Diálogos de confirmación con Radix Dialog (focus
                                trap, portal, animaciones).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setConfirmOpen(true)}
                                >
                                    Confirmar Acción
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() =>
                                        setDestructiveConfirmOpen(true)
                                    }
                                >
                                    Eliminar Elemento
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <ConfirmDialog
                        open={confirmOpen}
                        onOpenChange={setConfirmOpen}
                        title="¿Confirmar publicación?"
                        description="El producto será visible en el marketplace para todos los usuarios."
                        confirmLabel="Publicar"
                        onConfirm={() =>
                            notificationService.success("Publicado", {
                                description:
                                    "El producto está ahora visible en el marketplace.",
                            })
                        }
                    />
                    <ConfirmDialog
                        open={destructiveConfirmOpen}
                        onOpenChange={setDestructiveConfirmOpen}
                        title="¿Eliminar producto?"
                        description="Esta acción no se puede deshacer. El producto y toda su información será eliminado permanentemente."
                        confirmLabel="Eliminar"
                        variant="destructive"
                        icon={
                            <AlertTriangle
                                className="h-6 w-6 text-destructive"
                                aria-hidden="true"
                            />
                        }
                        onConfirm={() =>
                            notificationService.success("Eliminado", {
                                description:
                                    "El producto ha sido eliminado correctamente.",
                            })
                        }
                    />
                </section>
            </div>
        </div>
    );
}
