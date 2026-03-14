/**
 * Test page — component sandbox for BioCommerce Caldas Mobile.
 * Demonstrates all RNR components + common components with the Caldas green theme.
 * Access via the test route to verify dark/light mode, notifications, etc.
 */

import {
    ConfirmDialog,
    DataCard,
    EmptyState,
    ErrorFallback,
    LoadingSpinner,
    SearchInput,
    StatusBadge,
    ThemeToggle,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { notificationService } from "@/lib/notifications";
import {
    AlertTriangle,
    CheckCircle2,
    Info,
    Leaf,
    Search as SearchIcon,
    XCircle,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

/** Section header helper */
function SectionHeader({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <View className="mb-4">
            <Text className="text-xl font-semibold text-foreground">
                {title}
            </Text>
            {description && (
                <Text className="text-sm text-muted-foreground mt-1">
                    {description}
                </Text>
            )}
        </View>
    );
}

export default function TestPage() {
    const { colorScheme } = useColorScheme();
    const [isEnabled, setIsEnabled] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [destructiveConfirmOpen, setDestructiveConfirmOpen] = useState(false);
    const [progressValue, setProgressValue] = useState(45);

    const iconColor =
        colorScheme === "dark"
            ? "hsl(149, 20%, 98%)"
            : "hsl(149, 10%, 15%)";
    const primaryColor =
        colorScheme === "dark"
            ? "hsl(149, 50%, 50%)"
            : "hsl(149, 70%, 35%)";

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        >
            {/* ─── Network Status Banner ─────────────────────── */}
            {/* NetworkStatus hace llamadas de red reales; descomentar en producción */}
            {/* <NetworkStatus className="mb-4 -mx-4 -mt-4 rounded-none" /> */}

            {/* Header */}
            <View className="mb-8">
                <Text variant="h3">Página de Pruebas</Text>
                <Text className="text-muted-foreground mt-2">
                    Sandbox completo de componentes RNR / Shadcn con tema verde
                    Caldas. Incluye componentes UI base y componentes common.
                </Text>
            </View>

            {/* ─── Section 1: Theme & Color Palette ─────────── */}
            <View className="mb-8">
                <SectionHeader
                    title="Tema y Paleta de Colores"
                    description="Toggle claro/oscuro y muestrario de tokens de color del tema."
                />

                {/* Theme Toggle (common component) */}
                <Card className="mb-4">
                    <CardContent>
                        <ThemeToggle />
                    </CardContent>
                </Card>

                {/* Color Palette Grid */}
                <View className="flex-row flex-wrap gap-2">
                    <View className="flex-1 min-w-[30%] rounded-lg border border-border bg-background p-3 items-center">
                        <Text className="text-xs font-medium">Background</Text>
                        <Text className="text-[10px] text-muted-foreground">
                            bg-background
                        </Text>
                    </View>
                    <View className="flex-1 min-w-[30%] rounded-lg border border-border bg-card p-3 items-center">
                        <Text className="text-xs font-medium text-card-foreground">
                            Card
                        </Text>
                        <Text className="text-[10px] text-muted-foreground">
                            bg-card
                        </Text>
                    </View>
                    <View className="flex-1 min-w-[30%] rounded-lg border border-border bg-muted p-3 items-center">
                        <Text className="text-xs font-medium text-muted-foreground">
                            Muted
                        </Text>
                        <Text className="text-[10px] text-muted-foreground">
                            bg-muted
                        </Text>
                    </View>
                    <View className="flex-1 min-w-[30%] rounded-lg bg-primary p-3 items-center">
                        <Text className="text-xs font-medium text-primary-foreground">
                            Primary
                        </Text>
                        <Text className="text-[10px] text-primary-foreground/70">
                            bg-primary
                        </Text>
                    </View>
                    <View className="flex-1 min-w-[30%] rounded-lg bg-secondary p-3 items-center">
                        <Text className="text-xs font-medium text-secondary-foreground">
                            Secondary
                        </Text>
                        <Text className="text-[10px] text-secondary-foreground/70">
                            bg-secondary
                        </Text>
                    </View>
                    <View className="flex-1 min-w-[30%] rounded-lg bg-accent p-3 items-center">
                        <Text className="text-xs font-medium text-accent-foreground">
                            Accent
                        </Text>
                        <Text className="text-[10px] text-accent-foreground/70">
                            bg-accent
                        </Text>
                    </View>
                    <View className="flex-1 min-w-[30%] rounded-lg bg-destructive p-3 items-center">
                        <Text className="text-xs font-medium text-white">
                            Destructive
                        </Text>
                        <Text className="text-[10px] text-white/70">
                            bg-destructive
                        </Text>
                    </View>
                    <View className="flex-1 min-w-[30%] rounded-lg bg-success/15 border border-success/25 p-3 items-center">
                        <Text className="text-xs font-medium text-success">
                            Success
                        </Text>
                        <Text className="text-[10px] text-success/70">
                            semantic
                        </Text>
                    </View>
                    <View className="flex-1 min-w-[30%] rounded-lg bg-info/15 border border-info/25 p-3 items-center">
                        <Text className="text-xs font-medium text-info">
                            Info
                        </Text>
                        <Text className="text-[10px] text-info/70">
                            semantic
                        </Text>
                    </View>
                </View>
            </View>

            <Separator className="mb-8" />

            {/* ─── Section 2: Notifications (sonner-native) ─── */}
            <View className="mb-8">
                <SectionHeader
                    title="Notificaciones Sonner"
                    description="Toca cada botón para probar los diferentes estados de las notificaciones toast."
                />
                <View className="flex-row flex-wrap gap-3">
                    <Button
                        className="bg-green-600"
                        onPress={() =>
                            notificationService.success(
                                "Operación completada exitosamente",
                            )
                        }
                    >
                        <CheckCircle2 size={16} color="white" />
                        <Text className="text-white">Success</Text>
                    </Button>

                    <Button
                        variant="destructive"
                        onPress={() =>
                            notificationService.error("Error al procesar")
                        }
                    >
                        <XCircle size={16} color="white" />
                        <Text>Error</Text>
                    </Button>

                    <Button
                        className="bg-amber-500"
                        onPress={() =>
                            notificationService.warning(
                                "Tu sesión expirará en 5 minutos",
                            )
                        }
                    >
                        <AlertTriangle size={16} color="white" />
                        <Text className="text-white">Warning</Text>
                    </Button>

                    <Button
                        className="bg-blue-500"
                        onPress={() =>
                            notificationService.info(
                                "Se encontraron 42 especies",
                            )
                        }
                    >
                        <Info size={16} color="white" />
                        <Text className="text-white">Info</Text>
                    </Button>

                    <Button
                        variant="secondary"
                        onPress={() => {
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
                                    loading: "Identificando especie...",
                                    success: (data) =>
                                        `${data}: Quercus humboldtii`,
                                    error: () => "Error al identificar",
                                },
                            );
                        }}
                    >
                        <Leaf size={16} color={iconColor} />
                        <Text>Promise (2.5s)</Text>
                    </Button>

                    <Button
                        variant="ghost"
                        onPress={() => notificationService.dismiss()}
                    >
                        <Text>Cerrar Todas</Text>
                    </Button>
                </View>
            </View>

            <Separator className="mb-8" />

            {/* ─── Section 3: Button Variants ────────────────── */}
            <View className="mb-8">
                <SectionHeader
                    title="Variantes de Button"
                    description="Todos los estilos y tamaños disponibles del componente RNR Button."
                />
                <View className="flex-row flex-wrap gap-3">
                    <Button>
                        <Text>Default</Text>
                    </Button>
                    <Button variant="secondary">
                        <Text>Secondary</Text>
                    </Button>
                    <Button variant="destructive">
                        <Text>Destructive</Text>
                    </Button>
                    <Button variant="outline">
                        <Text>Outline</Text>
                    </Button>
                    <Button variant="ghost">
                        <Text>Ghost</Text>
                    </Button>
                    <Button variant="link">
                        <Text>Link</Text>
                    </Button>
                    <Button disabled>
                        <Text>Disabled</Text>
                    </Button>
                    <Button size="sm">
                        <Text>Small</Text>
                    </Button>
                    <Button size="lg">
                        <Text>Large</Text>
                    </Button>
                    <Button size="icon" accessibilityLabel="Icono">
                        <Leaf size={16} color={primaryColor} />
                    </Button>
                </View>
            </View>

            <Separator className="mb-8" />

            {/* ─── Section 4: Badges & StatusBadge ───────────── */}
            <View className="mb-8">
                <SectionHeader
                    title="Badges & StatusBadge"
                    description="RNR Badge primitivos y StatusBadge semánticos."
                />

                <View className="mb-4">
                    <Text className="mb-2 text-sm font-medium text-foreground">
                        RNR Badge:
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        <Badge>
                            <Text>Default</Text>
                        </Badge>
                        <Badge variant="secondary">
                            <Text>Secondary</Text>
                        </Badge>
                        <Badge variant="destructive">
                            <Text>Destructive</Text>
                        </Badge>
                        <Badge variant="outline">
                            <Text>Outline</Text>
                        </Badge>
                    </View>
                </View>

                <Separator className="mb-4" />

                <View>
                    <Text className="mb-2 text-sm font-medium text-foreground">
                        StatusBadge (semánticos):
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        <StatusBadge label="Activo" variant="success" />
                        <StatusBadge label="Pendiente" variant="warning" />
                        <StatusBadge label="Cancelado" variant="destructive" />
                        <StatusBadge label="Procesando" variant="info" />
                        <StatusBadge label="Borrador" variant="default" />
                        <StatusBadge label="Sin estado" variant="outline" />
                    </View>
                </View>

                <Separator className="my-4" />

                <View>
                    <Text className="mb-2 text-sm font-medium text-foreground">
                        StatusBadge (conservación IUCN):
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        <StatusBadge label="En Peligro Crítico" variant="destructive" />
                        <StatusBadge label="Vulnerable" variant="warning" />
                        <StatusBadge label="Preocupación Menor" variant="success" />
                        <StatusBadge label="Datos Insuficientes" variant="info" />
                    </View>
                </View>
            </View>

            <Separator className="mb-8" />

            {/* ─── Section 5: Form Controls ──────────────────── */}
            <View className="mb-8">
                <SectionHeader
                    title="Form Controls"
                    description="Input, Switch, Checkbox y Progress."
                />

                <View className="mb-4">
                    <Text className="mb-2 text-foreground font-medium">
                        Input Field
                    </Text>
                    <Input placeholder="Escriba algo aquí..." />
                </View>

                <View className="flex-row items-center justify-between mb-4 border border-border p-4 rounded-lg">
                    <View className="flex-1 mr-4">
                        <Text className="text-foreground font-medium">
                            Notificaciones
                        </Text>
                        <Text className="text-muted-foreground text-sm">
                            Recibir alertas por nuevas identificaciones.
                        </Text>
                    </View>
                    <Switch
                        checked={isEnabled}
                        onCheckedChange={setIsEnabled}
                    />
                </View>

                <View className="flex-row items-center gap-2 mb-4">
                    <Checkbox
                        checked={isChecked}
                        onCheckedChange={setIsChecked}
                    />
                    <Text className="text-foreground font-medium">
                        Acepto los términos y condiciones
                    </Text>
                </View>

                <View>
                    <Text className="mb-2 text-foreground font-medium">
                        Progress ({progressValue}%)
                    </Text>
                    <Progress value={progressValue} />
                    <View className="flex-row gap-2 mt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onPress={() =>
                                setProgressValue(Math.max(0, progressValue - 10))
                            }
                        >
                            <Text>-10</Text>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onPress={() =>
                                setProgressValue(
                                    Math.min(100, progressValue + 10),
                                )
                            }
                        >
                            <Text>+10</Text>
                        </Button>
                    </View>
                </View>
            </View>

            <Separator className="mb-8" />

            {/* ─── Section 6: SearchInput ─────────────────────── */}
            <View className="mb-8">
                <SectionHeader
                    title="SearchInput"
                    description="Campo de búsqueda con debounce de 300ms y botón de limpiar."
                />

                <SearchInput
                    value={searchValue}
                    onChange={setSearchValue}
                    placeholder="Buscar especie..."
                />
                {searchValue.length > 0 && (
                    <Text className="mt-2 text-sm text-muted-foreground">
                        Buscando: &quot;{searchValue}&quot;
                    </Text>
                )}
            </View>

            <Separator className="mb-8" />

            {/* ─── Section 7: DataCards ────────────────────────── */}
            <View className="mb-8">
                <SectionHeader
                    title="DataCards"
                    description="Tarjetas de datos para catálogo de especies."
                />

                <View className="gap-4">
                    <DataCard
                        title="Quercus humboldtii"
                        subtitle="Roble de tierra fría"
                        badge={
                            <StatusBadge label="Vulnerable" variant="warning" />
                        }
                        footer={
                            <Text className="text-muted-foreground text-sm">
                                Fagaceae · Manizales, Caldas
                            </Text>
                        }
                    >
                        <Text className="text-xs text-muted-foreground">
                            Árbol nativo de los bosques andinos. Altura:
                            25-30m. Importancia ecológica sustancial.
                        </Text>
                    </DataCard>

                    <DataCard
                        title="Palma de Cera del Quindío"
                        subtitle="Ceroxylon quindiuense"
                        badge={
                            <StatusBadge
                                label="En Peligro"
                                variant="destructive"
                            />
                        }
                        onPress={() =>
                            notificationService.info(
                                "Navegando a detalle de especie...",
                            )
                        }
                    >
                        <Text className="text-xs text-muted-foreground">
                            Árbol nacional de Colombia. Hasta 60m de altura.
                            Especie protegida.
                        </Text>
                    </DataCard>

                    <DataCard
                        title="Cattleya trianae"
                        subtitle="Flor de mayo"
                        badge={
                            <StatusBadge
                                label="Preocupación Menor"
                                variant="success"
                            />
                        }
                        footer={
                            <Text className="text-muted-foreground text-sm">
                                Orchidaceae · Orquídea nacional
                            </Text>
                        }
                    />
                </View>
            </View>

            <Separator className="mb-8" />

            {/* ─── Section 8: Cards (Species) ─────────────────── */}
            <View className="mb-8">
                <SectionHeader
                    title="Cards"
                    description="Tarjeta compuesta con header, content y footer."
                />

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Quercus humboldtii</CardTitle>
                        <CardDescription>
                            Roble nativo de Colombia
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Text className="text-foreground">
                            Altura promedio de 25m, predominante en los bosques
                            andinos. Considerado maderable y con importancia
                            ecológica sustancial.
                        </Text>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="flex-1">
                            <Text>Ver detalles</Text>
                        </Button>
                    </CardFooter>
                </Card>

                {/* Semantic color cards */}
                <View className="flex-row gap-3">
                    <View className="flex-1 p-3 bg-success rounded-lg border border-success">
                        <Text className="font-bold text-success-foreground text-center text-sm">
                            Aprobado
                        </Text>
                    </View>
                    <View className="flex-1 p-3 bg-warning rounded-lg border border-warning">
                        <Text className="font-bold text-warning-foreground text-center text-sm">
                            Precaución
                        </Text>
                    </View>
                    <View className="flex-1 p-3 bg-info rounded-lg border border-info">
                        <Text className="font-bold text-info-foreground text-center text-sm">
                            Info
                        </Text>
                    </View>
                </View>
            </View>

            <Separator className="mb-8" />

            {/* ─── Section 9: States (Empty, Error, Loading) ─── */}
            <View className="mb-8">
                <SectionHeader
                    title="Estados (Empty, Error, Loading)"
                    description="Componentes para estados vacío, error y carga."
                />

                <View className="gap-4">
                    <EmptyState
                        icon={
                            <SearchIcon
                                size={32}
                                color={
                                    colorScheme === "dark"
                                        ? "hsl(149, 10%, 65%)"
                                        : "hsl(149, 10%, 50%)"
                                }
                            />
                        }
                        title="No se encontraron resultados"
                        description="Intenta ajustar los filtros de búsqueda o explorar otra categoría."
                        action={
                            <Button variant="outline" size="sm">
                                <Text>Limpiar Filtros</Text>
                            </Button>
                        }
                    />

                    <ErrorFallback
                        title="Error de conexión"
                        message="No se pudo conectar con el servidor. Verifica tu conexión a internet."
                        onRetry={() =>
                            notificationService.info("Reintentando...")
                        }
                    />

                    <Card className="items-center justify-center p-10">
                        <LoadingSpinner
                            size="lg"
                            label="Cargando datos..."
                        />
                    </Card>

                    <Card className="items-center justify-center p-10">
                        <LoadingSpinner
                            size="md"
                            label="Usando ActivityIndicator nativo..."
                            native
                        />
                    </Card>
                </View>
            </View>

            <Separator className="mb-8" />

            {/* ─── Section 10: ConfirmDialog ──────────────────── */}
            <View className="mb-8">
                <SectionHeader
                    title="ConfirmDialog"
                    description="Diálogos de confirmación con AlertDialog RNR (focus trap, portal, animaciones)."
                />

                <View className="flex-row flex-wrap gap-3">
                    <ConfirmDialog
                        trigger={
                            <Pressable>
                                <Button variant="outline">
                                    <Text>Confirmar Acción</Text>
                                </Button>
                            </Pressable>
                        }
                        title="¿Confirmar observación?"
                        description="La observación será registrada y sincronizada con el servidor cuando haya conexión."
                        confirmLabel="Registrar"
                        onConfirm={() =>
                            notificationService.success(
                                "Observación registrada",
                            )
                        }
                        open={confirmOpen}
                        onOpenChange={setConfirmOpen}
                    />

                    <ConfirmDialog
                        trigger={
                            <Pressable>
                                <Button variant="destructive">
                                    <Text>Eliminar Datos Offline</Text>
                                </Button>
                            </Pressable>
                        }
                        title="¿Eliminar datos offline?"
                        description="Esta acción no se puede deshacer. Se eliminarán todas las observaciones pendientes de sincronizar."
                        confirmLabel="Eliminar"
                        onConfirm={() =>
                            notificationService.success(
                                "Datos offline eliminados",
                            )
                        }
                        open={destructiveConfirmOpen}
                        onOpenChange={setDestructiveConfirmOpen}
                    />
                </View>
            </View>
        </ScrollView>
    );
}
