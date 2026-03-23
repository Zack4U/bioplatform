/**
 * NetworkStatus — offline/online connectivity indicator.
 * Mobile-specific component. Critical for offline-first architecture.
 *
 * Shows a dismissible banner when the device goes offline,
 * and a brief toast when it comes back online.
 *
 * NOTE: Install @react-native-community/netinfo for real-time connectivity:
 *   npx expo install @react-native-community/netinfo
 * Then uncomment the NetInfo import and replace the useNetworkMonitor hook.
 */

import { Text } from "@/components/ui/text";
import { notificationService } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { WifiOff } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import { AppState, type AppStateStatus, Pressable, View } from "react-native";

interface NetworkStatusProps {
    className?: string;
}

/**
 * Simple network check using fetch.
 * Replace with @react-native-community/netinfo for production.
 */
function useNetworkMonitor() {
    const [isConnected, setIsConnected] = useState<boolean>(true);

    const checkConnection = useCallback(async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            await fetch("https://clients3.google.com/generate_204", {
                method: "HEAD",
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            setIsConnected(true);
        } catch {
            setIsConnected(false);
        }
    }, []);

    useEffect(() => {
        checkConnection();

        // Re-check when app comes to foreground
        const handleAppState = (nextState: AppStateStatus) => {
            if (nextState === "active") {
                checkConnection();
            }
        };

        const subscription = AppState.addEventListener(
            "change",
            handleAppState,
        );

        // Periodic check every 30 seconds
        const interval = setInterval(checkConnection, 30_000);

        return () => {
            subscription.remove();
            clearInterval(interval);
        };
    }, [checkConnection]);

    return isConnected;
}

export function NetworkStatus({ className }: NetworkStatusProps) {
    const { colorScheme } = useColorScheme();
    const isConnected = useNetworkMonitor();
    const [dismissed, setDismissed] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        if (!isConnected) {
            setWasOffline(true);
            setDismissed(false);
        } else if (wasOffline && isConnected) {
            notificationService.success("Conexión restaurada");
            setWasOffline(false);
        }
    }, [isConnected, wasOffline]);

    // Don't render if connected or dismissed
    if (isConnected || dismissed) {
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
