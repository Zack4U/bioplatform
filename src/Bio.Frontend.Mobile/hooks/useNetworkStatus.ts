/**
 * useNetworkStatus — real-time device connectivity via @react-native-community/netinfo.
 *
 * Replaces ad-hoc fetch polling with the OS connectivity APIs. Exposes both the
 * raw link state (isConnected) and reachability (isInternetReachable, which may
 * be null while the probe is in flight). Foundation for the offline-first flow
 * (sync triggers, upload-queue flush, offline banners).
 *
 * @module hooks/useNetworkStatus
 */

import NetInfo, {
    NetInfoStateType,
    type NetInfoState,
} from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export interface NetworkStatus {
    /** Device has an active network link (wifi/cellular). */
    isConnected: boolean;
    /** Internet is actually reachable. null while the reachability probe runs. */
    isInternetReachable: boolean | null;
    /** Connection type reported by the OS ("wifi", "cellular", "none", etc.). */
    type: NetInfoState["type"];
}

function toStatus(state: NetInfoState): NetworkStatus {
    return {
        isConnected: Boolean(state.isConnected),
        isInternetReachable: state.isInternetReachable,
        type: state.type,
    };
}

export function useNetworkStatus(): NetworkStatus {
    const [status, setStatus] = useState<NetworkStatus>({
        isConnected: true,
        isInternetReachable: null,
        type: NetInfoStateType.unknown,
    });

    useEffect(() => {
        // Seed with the current state, then subscribe to changes.
        void NetInfo.fetch().then((state) => setStatus(toStatus(state)));
        const unsubscribe = NetInfo.addEventListener((state) =>
            setStatus(toStatus(state)),
        );
        return () => unsubscribe();
    }, []);

    return status;
}
