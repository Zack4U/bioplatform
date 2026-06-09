/**
 * useReconnectSync — flushes the offline state when connectivity is restored.
 *
 * Mounted once at the app root. On an offline → online transition it triggers a
 * sync (upload-queue flush, plus catalog refresh when offline mode is enabled).
 *
 * @module hooks/useReconnectSync
 */

import { useOfflineStore } from "@/store/offline-store";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef } from "react";

export function useReconnectSync(): void {
    const wasOnline = useRef<boolean | null>(null);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const online = Boolean(
                state.isConnected && state.isInternetReachable !== false,
            );
            // Only act on a real offline → online edge.
            if (wasOnline.current === false && online) {
                void useOfflineStore.getState().syncNow();
            }
            wasOnline.current = online;
        });
        return () => unsubscribe();
    }, []);
}
