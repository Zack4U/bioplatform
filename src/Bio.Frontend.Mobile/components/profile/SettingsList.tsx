/**
 * SettingsList — Preferences and Information card sections with SettingRow component.
 * Theme selector uses useThemeMode hook for light/dark/system support.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { THEME } from "@/lib/theme";
import {
    Bell,
    ChevronRight,
    CloudOff,
    HardDrive,
    Info,
    Sparkles,
    Sun,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";

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

// ─── SettingsList ────────────────────────────────────────────────────────────

export function SettingsList() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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

                    <SettingRow
                        icon={
                            <HardDrive
                                size={18}
                                color={theme.foreground}
                                strokeWidth={1.5}
                            />
                        }
                        label="Datos Offline"
                        subtitle="Catálogo descargado localmente"
                        right={
                            <Badge variant="secondary" className="px-3 py-1">
                                <Text className="text-[10px] text-muted-foreground">
                                    0 registros
                                </Text>
                            </Badge>
                        }
                    />

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
                        subtitle="Última sincronización: --"
                        right={
                            <Badge
                                variant="outline"
                                className="px-3 py-1 border-warning/40"
                            >
                                <Text className="text-[10px] text-warning">
                                    Pendiente
                                </Text>
                            </Badge>
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
