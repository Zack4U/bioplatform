/**
 * Cart Zustand store — client-side shopping cart.
 * Persisted in localStorage for session continuity.
 */

import type { CartItem } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
    items: CartItem[];
    isOpen: boolean;

    addItem: (item: CartItem) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;

    /** Computed */
    totalItems: () => number;
    totalAmount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (newItem) =>
                set((state) => {
                    const existing = state.items.find(
                        (item) => item.productId === newItem.productId,
                    );
                    if (existing) {
                        return {
                            items: state.items.map((item) =>
                                item.productId === newItem.productId
                                    ? {
                                          ...item,
                                          quantity: Math.min(
                                              item.quantity + newItem.quantity,
                                              item.maxStock,
                                          ),
                                      }
                                    : item,
                            ),
                        };
                    }
                    return { items: [...state.items, newItem] };
                }),

            removeItem: (productId) =>
                set((state) => ({
                    items: state.items.filter(
                        (item) => item.productId !== productId,
                    ),
                })),

            updateQuantity: (productId, quantity) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.productId === productId
                            ? {
                                  ...item,
                                  quantity: Math.max(
                                      1,
                                      Math.min(quantity, item.maxStock),
                                  ),
                              }
                            : item,
                    ),
                })),

            clearCart: () => set({ items: [] }),
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

            totalItems: () =>
                get().items.reduce((sum, item) => sum + item.quantity, 0),

            totalAmount: () =>
                get().items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0,
                ),
        }),
        {
            name: "bio-cart-storage",
        },
    ),
);
