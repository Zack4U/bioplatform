/**
 * NetworkStatus — offline/online connectivity indicator.
 * Mobile-specific component. Critical for offline-first architecture.
 *
 * Shows a dismissible banner when the device goes offline,
 * and a brief toast when it comes back online.
 *
 * Connectivity is observed in real time via @react-native-community/netinfo.
 */

import { Text } from "@/components/ui/text";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { notificationService } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { WifiOff } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

interface NetworkStatusProps {
    className?: string;
}

export function NetworkStatus({ className }: NetworkStatusProps) {
    const { colorScheme } = useColorScheme();
    const { isConnected, isInternetReachable } = useNetworkStatus();
    const [dismissed, setDismissed] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    // Treat an unreachable internet (captive portal / no route) as offline too.
    const online = isConnected && isInternetReachable !== false;

    useEffect(() => {
        if (!online) {
            setWasOffline(true);
            setDismissed(false);
        } else if (wasOffline && online) {
            notificationService.success("Conexión restaurada");
            setWasOffline(false);
        }
    }, [online, wasOffline]);

    // Don't render if online or dismissed
    if (online || dismissed) {
        return null;
    }

    return (
        <Pressable
            onPress={() => setDismissed(true)}
            accessibilityRole="alert"
            accessibilityLabel="Sin conexión a internet. Toca para descartar."
        >
            <View
                className={cn(
                    "flex-row items-center justify-center gap-2 bg-warning/90 px-4 py-2",
                    className,
                )}
            >
                <WifiOff
                    size={16}
                    color={
                        colorScheme === "dark"
                            ? "hsl(45, 80%, 20%)"
                            : "hsl(45, 80%, 20%)"
                    }
                />
                <Text className="text-sm font-medium text-warning-foreground">
                    Sin conexión — Modo offline
                </Text>
            </View>
        </Pressable>
    );
}
