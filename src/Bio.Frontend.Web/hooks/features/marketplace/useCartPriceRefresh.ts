/**
 * useCartPriceRefresh — validates cart item prices against the server.
 *
 * Called when:
 *  - CartPreview panel opens (isOpen becomes true)
 *  - The /cart checkout page mounts
 *
 * Does NOT mutate state blindly — only updates prices when they changed,
 * and removes items the server reports as inactive/unavailable.
 * Shows a warning toast if any price changed or item became unavailable.
 *
 * @module hooks/features/marketplace/useCartPriceRefresh
 */

"use client";

import { validateCartPrices } from "@/services/marketplace-service";
import { useCartStore } from "@/store/cart-store";
import { handleApiError } from "@/lib/error-handler";
import { notificationService } from "@/lib/notifications";
import { useEffect, useRef, useState } from "react";

/**
 * @param enabled - Set to true when the cart should be validated (panel open, checkout page mounted).
 */
export function useCartPriceRefresh(enabled: boolean) {
    const items = useCartStore((s) => s.items);
    const updateItemPrice = useCartStore((s) => s.updateItemPrice);
    const markItemUnavailable = useCartStore((s) => s.markItemUnavailable);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

    // Throttle: don't re-validate if we validated in the last 60 seconds
    const lastRefreshRef = useRef<number>(0);
    const THROTTLE_MS = 60_000;

    useEffect(() => {
        if (!enabled || items.length === 0) return;

        const now = Date.now();
        if (now - lastRefreshRef.current < THROTTLE_MS) return;

        const cartItems = items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
        }));

        void (async () => {
            setIsRefreshing(true);
            try {
                const response = await validateCartPrices(cartItems);
                lastRefreshRef.current = Date.now();
                setLastRefreshedAt(new Date());

                let priceChangedCount = 0;
                let removedCount = 0;

                for (const validation of response.items) {
                    if (!validation.isActive || validation.availableStock === 0) {
                        markItemUnavailable(validation.productId);
                        removedCount++;
                        continue;
                    }

                    // Find the stored price for this product
                    const stored = items.find((i) => i.productId === validation.productId);
                    if (stored && Math.abs(stored.price - validation.currentPrice) > 0.001) {
                        updateItemPrice(validation.productId, validation.currentPrice);
                        priceChangedCount++;
                    }
                }

                if (removedCount > 0) {
                    notificationService.warning(
                        `${removedCount} producto${removedCount !== 1 ? "s" : ""} ${removedCount !== 1 ? "fueron eliminados" : "fue eliminado"} del carrito por no estar disponible${removedCount !== 1 ? "s" : ""}.`,
                    );
                }

                if (priceChangedCount > 0) {
                    notificationService.warning(
                        `El precio de ${priceChangedCount} producto${priceChangedCount !== 1 ? "s" : ""} cambió. Los precios han sido actualizados.`,
                    );
                }
            } catch (error) {
                handleApiError(error);
            } finally {
                setIsRefreshing(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    return { isRefreshing, lastRefreshedAt };
}
