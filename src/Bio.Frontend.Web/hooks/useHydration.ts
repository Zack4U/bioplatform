/**
 * useHydration — ensures Zustand persisted stores are hydrated before rendering.
 *
 * Problem: Zustand persist middleware restores state from localStorage on client,
 * but SSR renders with the initial (empty) state. This causes hydration mismatches
 * for components that depend on persisted state (cart count, badges, etc.).
 *
 * Solution: Uses useSyncExternalStore with server snapshot returning false
 * and client snapshot returning true, letting React handle the hydration correctly.
 *
 * @module hooks/useHydration
 */

"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Returns `true` once the client has mounted and Zustand stores have rehydrated.
 * Use this to gate rendering of components that depend on persisted store state.
 *
 * @example
 * const isHydrated = useHydration();
 * const count = isHydrated ? totalItems() : 0;
 */
export function useHydration() {
    return useSyncExternalStore(
        emptySubscribe,
        getClientSnapshot,
        getServerSnapshot,
    );
}
