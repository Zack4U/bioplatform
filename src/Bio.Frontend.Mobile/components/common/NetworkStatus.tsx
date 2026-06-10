/**
 * NetworkStatus — app-wide offline indicator banner.
 *
 * Shows when the device loses connectivity (auto offline) or when the user
 * forces offline mode manually. Renders as a top overlay (mounted once at the
 * app root). A brief toast confirms when connectivity is restored.
 *
 * Reads connectivity/mode from the offline store (fed by useOfflineConnectivity).
 *
 * @module components/common/NetworkStatus
 */

import { Text } from "@/components/ui/text";
import { notificationService } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { useOfflineStore } from "@/store/offline-store";
import { CloudOff, WifiOff } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NetworkStatusProps {
    className?: string;
}

export function NetworkStatus({ className }: NetworkStatusProps) {
    const { colorScheme } = useColorScheme();
    const insets = useSafeAreaInsets();
    const isOnline = useOfflineStore((s) => s.isOnline);
    const manualOffline = useOfflineStore((s) => s.manualOffline);

    const [dismissed, setDismissed] = useState(false);
    const [wasDisconnected, setWasDisconnected] = useState(false);

    // Toast once when real connectivity returns.
    useEffect(() => {
        if (!isOnline) {
            setWasDisconnected(true);
            setDismissed(false);
        } else if (wasDisconnected) {
            notificationService.success("Conexión restaurada");
            setWasDisconnected(false);
        }
    }, [isOnline, wasDisconnected]);

    const connectivityOffline = !isOnline;
    const showBanner = (connectivityOffline || manualOffline) && !dismissed;

    if (!showBanner) return null;

    const iconColor =
        colorScheme === "dark" ? "hsl(45, 80%, 20%)" : "hsl(45, 80%, 20%)";

    // Manual offline mode is intentional → not dismissible by tap.
    const dismissible = connectivityOffline && !manualOffline;

    return (
        <Pressable
            onPress={dismissible ? () => setDismissed(true) : undefined}
            accessibilityRole="alert"
            accessibilityLabel={
                manualOffline
                    ? "Modo offline activado manualmente."
                    : "Sin conexión a internet. Toca para descartar."
            }
            style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 }}
        >
            <View
                className={cn(
                    "flex-row items-center justify-center gap-2 bg-warning/95 px-4 pb-2",
                    className,
                )}
                style={{ paddingTop: insets.top + 6 }}
            >
                {manualOffline ? (
                    <CloudOff size={15} color={iconColor} />
                ) : (
                    <WifiOff size={15} color={iconColor} />
                )}
                <Text className="text-sm font-medium text-warning-foreground">
                    {manualOffline
                        ? "Modo offline activado"
                        : "Sin conexión — Modo offline"}
                </Text>
            </View>
        </Pressable>
    );
}
