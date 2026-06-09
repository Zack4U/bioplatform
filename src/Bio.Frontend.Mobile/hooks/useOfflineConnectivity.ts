/**
 * useOfflineConnectivity — feeds device connectivity into the offline store.
 *
 * Mounted once at the app root. Subscribes to NetInfo and updates
 * offlineStore.isOnline; the store handles auto-flush on the offline → online
 * edge. Drives automatic offline mode (effectiveOffline = manualOffline ||
 * !isOnline).
 *
 * @module hooks/useOfflineConnectivity
 */

import { useOfflineStore } from "@/store/offline-store";
import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";

export function useOfflineConnectivity(): void {
    useEffect(() => {
        const apply = (
            isConnected: boolean | null,
            isInternetReachable: boolean | null,
        ) => {
            const online = Boolean(
                isConnected && isInternetReachable !== false,
            );
            useOfflineStore.getState().setOnline(online);
        };

        void NetInfo.fetch().then((state) =>
            apply(state.isConnected, state.isInternetReachable),
        );
        const unsubscribe = NetInfo.addEventListener((state) =>
            apply(state.isConnected, state.isInternetReachable),
        );
        return () => unsubscribe();
    }, []);
}
