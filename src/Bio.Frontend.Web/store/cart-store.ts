/**
 * Cart Zustand store — client-side shopping cart with checkout state.
 * Persisted in localStorage for session continuity.
 *
 * @module store/cart-store
 */

import type { CartItem, CouponCode } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
    /* ── Cart items ─────────────────────────────────────────────────────── */
    items: CartItem[];
    isOpen: boolean;

    addItem: (item: CartItem) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;

    /* ── Checkout selection ─────────────────────────────────────────────── */
    /** Product IDs selected for checkout (step 1 checkboxes). */
    selectedItemIds: string[];
    toggleItemSelection: (productId: string) => void;
    selectAllItems: () => void;
    deselectAllItems: () => void;
    isItemSelected: (productId: string) => boolean;

    /* ── Addresses ──────────────────────────────────────────────────────── */
    shippingAddressId: string | null;
    billingAddressId: string | null;
    useSameAddress: boolean;
    setShippingAddressId: (id: string) => void;
    setBillingAddressId: (id: string) => void;
    setUseSameAddress: (val: boolean) => void;

    /* ── Coupon ─────────────────────────────────────────────────────────── */
    appliedCoupon: CouponCode | null;
    applyCoupon: (coupon: CouponCode) => void;
    removeCoupon: () => void;

    /* ── Notes ──────────────────────────────────────────────────────────── */
    orderNotes: string;
    setOrderNotes: (notes: string) => void;

    /* ── Computed ───────────────────────────────────────────────────────── */
    totalItems: () => number;
    totalAmount: () => number;
    selectedItems: () => CartItem[];
    selectedSubtotal: () => number;

    /* ── Reset checkout state (after successful order) ─────────────────── */
    resetCheckout: () => void;

    /* ── Price refresh (from server validation) ─────────────────────────── */
    /** Update a cart item's stored price with the current server price. */
    updateItemPrice: (productId: string, newPrice: number) => void;
    /** Remove an item that the server reports as inactive or out of stock. */
    markItemUnavailable: (productId: string) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            // ── Cart items ───────────────────────────────────────────
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
                    return {
                        items: [...state.items, newItem],
                        selectedItemIds: [
                            ...state.selectedItemIds,
                            newItem.productId,
                        ],
                    };
                }),

            removeItem: (productId) =>
                set((state) => ({
                    items: state.items.filter(
                        (item) => item.productId !== productId,
                    ),
                    selectedItemIds: state.selectedItemIds.filter(
                        (id) => id !== productId,
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

            clearCart: () =>
                set({
                    items: [],
                    selectedItemIds: [],
                    appliedCoupon: null,
                    orderNotes: "",
                }),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

            // ── Checkout selection ───────────────────────────────────
            selectedItemIds: [],

            toggleItemSelection: (productId) =>
                set((state) => ({
                    selectedItemIds: state.selectedItemIds.includes(productId)
                        ? state.selectedItemIds.filter((id) => id !== productId)
                        : [...state.selectedItemIds, productId],
                })),

            selectAllItems: () =>
                set((state) => ({
                    selectedItemIds: state.items.map((i) => i.productId),
                })),

            deselectAllItems: () => set({ selectedItemIds: [] }),

            isItemSelected: (productId) =>
                get().selectedItemIds.includes(productId),

            // ── Addresses ────────────────────────────────────────────
            shippingAddressId: null,
            billingAddressId: null,
            useSameAddress: true,

            setShippingAddressId: (id) => set({ shippingAddressId: id }),
            setBillingAddressId: (id) => set({ billingAddressId: id }),
            setUseSameAddress: (val) => set({ useSameAddress: val }),

            // ── Coupon ───────────────────────────────────────────────
            appliedCoupon: null,
            applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
            removeCoupon: () => set({ appliedCoupon: null }),

            // ── Notes ────────────────────────────────────────────────
            orderNotes: "",
            setOrderNotes: (notes) => set({ orderNotes: notes }),

            // ── Computed ─────────────────────────────────────────────
            totalItems: () =>
                get().items.reduce((sum, item) => sum + item.quantity, 0),

            totalAmount: () =>
                get().items.reduce(
                    (sum, item) => sum + item.sellPrice * item.quantity,
                    0,
                ),

            selectedItems: () => {
                const { items, selectedItemIds } = get();
                return items.filter((i) =>
                    selectedItemIds.includes(i.productId),
                );
            },

            selectedSubtotal: () => {
                const { items, selectedItemIds } = get();
                return items
                    .filter((i) => selectedItemIds.includes(i.productId))
                    .reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);
            },

            // ── Reset checkout ───────────────────────────────────────
            resetCheckout: () =>
                set({
                    selectedItemIds: [],
                    shippingAddressId: null,
                    billingAddressId: null,
                    useSameAddress: true,
                    appliedCoupon: null,
                    orderNotes: "",
                }),

            // ── Price refresh ────────────────────────────────────────
            updateItemPrice: (productId, newPrice) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.productId === productId
                            ? { ...item, price: newPrice }
                            : item,
                    ),
                })),

            markItemUnavailable: (productId) =>
                set((state) => ({
                    items: state.items.filter((item) => item.productId !== productId),
                    selectedItemIds: state.selectedItemIds.filter((id) => id !== productId),
                })),
        }),
        {
            name: "bio-cart-storage",
            partialize: (state) => ({
                items: state.items,
                selectedItemIds: state.selectedItemIds,
                shippingAddressId: state.shippingAddressId,
                billingAddressId: state.billingAddressId,
                useSameAddress: state.useSameAddress,
                appliedCoupon: state.appliedCoupon,
                orderNotes: state.orderNotes,
            }),
        },
    ),
);
