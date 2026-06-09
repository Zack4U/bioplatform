/**
 * SettingsList — Preferences and Information card sections with SettingRow component.
 * Theme selector uses useThemeMode hook for light/dark/system support.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    type Option,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { useModelInfo, useModelMetrics } from "@/hooks/useClassification";
import { useThemeMode, type ThemeMode } from "@/hooks/useThemeMode";
import { estimateImagesSizeBytes, formatBytes } from "@/lib/offline-files";
import { THEME } from "@/lib/theme";
import { useOfflineStore } from "@/store/offline-store";
import {
    Bell,
    ChevronRight,
    CloudOff,
    HardDrive,
    Images,
    Info,
    RefreshCw,
    Sparkles,
    Sun,
    WifiOff,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

/** Format an ISO timestamp into a short local "última sincronización" label. */
function formatLastSync(iso: string | null): string {
    if (!iso) return "Sin sincronizar";
    try {
        return new Date(iso).toLocaleString("es-CO", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "Sin sincronizar";
    }
}

// ─── SettingRow ──────────────────────────────────────────────────────────────

interface SettingRowProps {
    icon: React.ReactNode;
    label: string;
    subtitle?: string;
    right?: React.ReactNode;
    onPress?: () => void;
}

function SettingRow({
    icon,
    label,
    subtitle,
    right,
    onPress,
}: SettingRowProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            className="flex-row items-center py-4 active:opacity-70"
        >
            <View className="w-10 h-10 rounded-xl bg-muted items-center justify-center mr-3">
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">
                    {label}
                </Text>
                {subtitle && (
                    <Text className="text-xs text-muted-foreground mt-0.5">
                        {subtitle}
                    </Text>
                )}
            </View>
            {right ??
                (onPress && (
                    <ChevronRight size={16} color="hsl(149, 10%, 50%)" />
                ))}
        </Pressable>
    );
}

// ─── Theme Select ───────────────────────────────────────────────────────────

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
    { value: "light", label: "Claro" },
    { value: "dark", label: "Oscuro" },
    { value: "system", label: "Automático" },
];

function ThemeSelect() {
    const { themeMode, setThemeMode } = useThemeMode();

    const selectedOption = useMemo<Option>(
        () => ({
            value: themeMode,
            label:
                THEME_OPTIONS.find((o) => o.value === themeMode)?.label ??
                "Automático",
        }),
        [themeMode],
    );

    return (
        <Select
            value={selectedOption}
            onValueChange={(option) => {
                if (option) setThemeMode(option.value as ThemeMode);
            }}
        >
            <SelectTrigger size="sm" className="min-w-[140px]">
                <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
                {THEME_OPTIONS.map((opt) => (
                    <SelectItem
                        key={opt.value}
                        value={opt.value}
                        label={opt.label}
                    />
                ))}
            </SelectContent>
        </Select>
    );
}

// ─── SyncProgressBar ───────────────────────────────────────────────────────────

interface SyncProgressBarProps {
    progress: { done: number; total: number; label: string } | null;
    labels: string[];
}

/** Inline progress bar shown under a setting row during a matching download phase. */
function SyncProgressBar({ progress, labels }: SyncProgressBarProps) {
    if (!progress || !labels.includes(progress.label)) return null;
    const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
    return (
        <View className="px-1 pb-3">
            <Progress value={pct} className="h-1.5 mb-1" />
            <Text className="text-[10px] text-muted-foreground">
                {progress.label}: {progress.done}/{progress.total} (
                {Math.round(pct)}%)
            </Text>
        </View>
    );
}

// ─── SettingsList ────────────────────────────────────────────────────────────

export function SettingsList() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Offline-first state
    const {
        enabled: offlineEnabled,
        imagesEnabled,
        status: syncStatus,
        progress,
        lastSyncAt,
        speciesCount,
        detailCount,
        pendingCount,
        imageCount,
        manualOffline,
        enableOffline,
        disableOffline,
        enableImages,
        disableImages,
        setManualOffline,
        syncNow,
        refreshCounts,
    } = useOfflineStore();

    useEffect(() => {
        void refreshCounts();
    }, [refreshCounts]);

    const isSyncing = syncStatus === "syncing";

    // Progress label shown while a download is in flight.
    const progressLabel = useMemo(() => {
        if (!progress) return null;
        const pct =
            progress.total > 0
                ? Math.round((progress.done / progress.total) * 100)
                : 0;
        return `${progress.label} ${pct}%`;
    }, [progress]);

    const estimatedImagesSize = useMemo(
        () => formatBytes(estimateImagesSizeBytes(speciesCount)),
        [speciesCount],
    );

    // Live model info — replaces the previously hardcoded model/accuracy string.
    const { data: modelInfo } = useModelInfo();
    const { data: modelMetrics } = useModelMetrics();

    const modelSubtitle = useMemo(() => {
        if (!modelInfo) return "Consultando servicio de IA…";
        const accuracy =
            modelMetrics?.accuracy != null
                ? ` — Precisión ${(modelMetrics.accuracy * 100).toFixed(1)}%`
                : "";
        return `${modelInfo.modelName} · ${modelInfo.numClasses} clases${accuracy}`;
    }, [modelInfo, modelMetrics]);

    return (
        <View className="px-5">
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Preferencias
            </Text>
            <Card className="border-0 shadow-sm mb-6">
                <CardContent className="px-4 py-1">
                    {/* Theme Select */}
                    <SettingRow
                        icon={
                            <Sun
                                size={18}
                                color={theme.foreground}
                                strokeWidth={1.5}
                            />
                        }
                        label="Apariencia"
                        subtitle="Tema de la aplicación"
                        right={<ThemeSelect />}
                    />

                    <Separator />

                    <SettingRow
                        icon={
                            <Bell
                                size={18}
                                color={theme.foreground}
                                strokeWidth={1.5}
                            />
                        }
                        label="Notificaciones"
                        subtitle="Alertas de nuevas identificaciones"
                        right={
                            <Switch
                                checked={notificationsEnabled}
                                onCheckedChange={setNotificationsEnabled}
                            />
                        }
                    />

                    <Separator />

                    {/* Manual offline mode — force local data even with network. */}
                    <SettingRow
                        icon={
                            <WifiOff
                                size={18}
                                color={theme.foreground}
                                strokeWidth={1.5}
                            />
                        }
                        label="Modo Offline"
                        subtitle="Forzar uso de datos locales"
                        right={
                            <Switch
                                checked={manualOffline}
                                onCheckedChange={(value) => {
                                    void setManualOffline(value);
                                }}
                            />
                        }
                    />

                    <Separator />

                    {/* Catalog + thumbnails download (authorization). */}
                    <SettingRow
                        icon={
                            <HardDrive
                                size={18}
                                color={theme.foreground}
                                strokeWidth={1.5}
                            />
                        }
                        label="Datos Offline"
                        subtitle={
                            isSyncing && progressLabel
                                ? `Descargando · ${progressLabel}`
                                : offlineEnabled
                                  ? `${detailCount}/${speciesCount} especies con detalle`
                                  : "Descargar catálogo completo y miniaturas"
                        }
                        right={
                            <Switch
                                checked={offlineEnabled}
                                onCheckedChange={(value) => {
                                    if (value) {
                                        void enableOffline();
                                    } else {
                                        void disableOffline();
                                    }
                                }}
                                disabled={isSyncing}
                            />
                        }
                    />

                    <SyncProgressBar
                        progress={progress}
                        labels={["Catálogo", "Miniaturas"]}
                    />

                    {offlineEnabled && (
                        <>
                            <Separator />

                            {/* Optional full image gallery download. */}
                            <SettingRow
                                icon={
                                    <Images
                                        size={18}
                                        color={theme.foreground}
                                        strokeWidth={1.5}
                                    />
                                }
                                label="Imágenes Offline"
                                subtitle={
                                    imagesEnabled
                                        ? `${imageCount} imágenes descargadas`
                                        : `Catálogo completo · ~${estimatedImagesSize} aprox.`
                                }
                                right={
                                    <Switch
                                        checked={imagesEnabled}
                                        onCheckedChange={(value) => {
                                            if (value) {
                                                void enableImages();
                                            } else {
                                                void disableImages();
                                            }
                                        }}
                                        disabled={isSyncing}
                                    />
                                }
                            />

                            <SyncProgressBar
                                progress={progress}
                                labels={["Imágenes"]}
                            />
                        </>
                    )}

                    <Separator />

                    <SettingRow
                        icon={
                            <CloudOff
                                size={18}
                                color={theme.foreground}
                                strokeWidth={1.5}
                            />
                        }
                        label="Sincronización"
                        subtitle={
                            isSyncing
                                ? progressLabel
                                    ? `Sincronizando · ${progressLabel}`
                                    : "Sincronizando..."
                                : `Última: ${formatLastSync(lastSyncAt)}`
                        }
                        onPress={isSyncing ? undefined : () => void syncNow()}
                        right={
                            isSyncing ? (
                                <ActivityIndicator
                                    size="small"
                                    color={theme.primary}
                                />
                            ) : pendingCount > 0 ? (
                                <Badge
                                    variant="outline"
                                    className="px-3 py-1 border-warning/40"
                                >
                                    <Text className="text-[10px] text-warning">
                                        {pendingCount} pendiente
                                        {pendingCount > 1 ? "s" : ""}
                                    </Text>
                                </Badge>
                            ) : (
                                <RefreshCw
                                    size={16}
                                    color={theme.mutedForeground}
                                    strokeWidth={1.8}
                                />
                            )
                        }
                    />
                </CardContent>
            </Card>

            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Información
            </Text>
            <Card className="border-0 shadow-sm mb-6">
                <CardContent className="px-4 py-1">
                    <SettingRow
                        icon={
                            <Info
                                size={18}
                                color={theme.foreground}
                                strokeWidth={1.5}
                            />
                        }
                        label="Acerca de"
                        subtitle="BioCommerce Caldas v1.0.0"
                    />
                    <Separator />
                    <SettingRow
                        icon={
                            <Sparkles
                                size={18}
                                color={theme.foreground}
                                strokeWidth={1.5}
                            />
                        }
                        label="Modelo IA"
                        subtitle={modelSubtitle}
                    />
                </CardContent>
            </Card>
        </View>
    );
}
