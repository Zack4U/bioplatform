/**
 * useCartSync — syncs the local Zustand cart with the backend after login.
 *
 * Called once when the user goes from unauthenticated → authenticated.
 * Uses a Zustand subscription to detect the authentication state change.
 *
 * Strategy:
 *  1. When isAuthenticated becomes true (login detected), read local cart items.
 *  2. If there are local items, call POST /api/v1/cart/sync.
 *  3. Backend merges and responds; we don't need to update the local store
 *     because the cart is already correct locally. The server cart is the source
 *     of truth for the next session.
 *  4. Show a toast if sync completed with items.
 *
 * @module hooks/features/marketplace/useCartSync
 */

"use client";

import { syncCart } from "@/services/marketplace-service";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { notificationService } from "@/lib/notifications";
import { handleApiError } from "@/lib/error-handler";
import { useEffect, useRef } from "react";

export function useCartSync() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isLoading = useAuthStore((s) => s.isLoading);
    const items = useCartStore((s) => s.items);

    // Track previous auth state to detect the login transition
    const prevAuthRef = useRef<boolean>(false);
    const hasSyncedRef = useRef<boolean>(false);

    useEffect(() => {
        // Wait until auth hydration is complete
        if (isLoading) return;

        const justLoggedIn = !prevAuthRef.current && isAuthenticated;
        prevAuthRef.current = isAuthenticated;

        if (!justLoggedIn) {
            // Reset sync flag on logout so next login triggers a fresh sync
            if (!isAuthenticated) hasSyncedRef.current = false;
            return;
        }

        // Only sync once per login session
        if (hasSyncedRef.current) return;
        hasSyncedRef.current = true;

        if (items.length === 0) return; // Nothing to sync

        const syncItems = items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
        }));

        void (async () => {
            try {
                await syncCart(syncItems);
                notificationService.info(
                    `${items.length} producto${items.length !== 1 ? "s" : ""} sincronizado${items.length !== 1 ? "s" : ""} con tu cuenta.`,
                    { duration: 3000 },
                );
            } catch (error) {
                // Non-critical: cart sync failure doesn't block the user
                handleApiError(error);
            }
        })();
    }, [isAuthenticated, isLoading, items]);
}
