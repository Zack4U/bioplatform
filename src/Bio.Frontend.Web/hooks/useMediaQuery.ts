/**
 * useMediaQuery — SSR-safe reactive media query hook.
 *
 * Uses `useSyncExternalStore` to avoid hydration mismatches. On the server
 * (and during the first client render) it always returns `false` so the
 * server-side and hydration snapshots match.
 *
 * @example
 * const isDesktop = useMediaQuery("(min-width: 768px)");
 *
 * @module hooks/useMediaQuery
 */

"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Core hook — subscribe to any CSS media query string.
 *
 * @param query  — valid CSS media query, e.g. "(min-width: 768px)"
 * @returns      — `true` when the query matches, `false` otherwise (or on SSR)
 */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (callback: () => void) => {
            if (typeof window === "undefined") return () => {};
            const mql = window.matchMedia(query);
            mql.addEventListener("change", callback);
            return () => mql.removeEventListener("change", callback);
        },
        [query],
    );

    const getSnapshot = useCallback(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia(query).matches;
    }, [query]);

    const getServerSnapshot = () => false;

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ─── Semantic breakpoint helpers (Tailwind defaults) ───────────────────── */

/**
 * Returns `true` when viewport width ≥ 768px (Tailwind `md`).
 * Use this to switch between mobile Drawer and desktop Dialog/Sheet.
 */
export function useIsMd(): boolean {
    return useMediaQuery("(min-width: 768px)");
}

/**
 * Returns `true` when viewport width ≥ 1024px (Tailwind `lg`).
 */
export function useIsLg(): boolean {
    return useMediaQuery("(min-width: 1024px)");
}

/**
 * Returns `true` when viewport width ≥ 1280px (Tailwind `xl`).
 */
export function useIsXl(): boolean {
    return useMediaQuery("(min-width: 1280px)");
}

/**
 * Returns `true` when viewport width < 768px (strictly mobile).
 * Equivalent to `!useIsMd()`.
 */
export function useIsMobile(): boolean {
    return !useMediaQuery("(min-width: 768px)");
}
