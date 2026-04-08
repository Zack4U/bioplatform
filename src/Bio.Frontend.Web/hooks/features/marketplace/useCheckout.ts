/**
 * useCheckout — multi-step checkout logic hook.
 *
 * Manages the 3-step checkout flow:
 *   1. resumen  — Cart review + item selection
 *   2. direccion — Shipping & billing address
 *   3. pagar   — Payment & order submission
 *
 * State source: URL `?tab=` for current step, Zustand cart-store for data.
 * Computes order summary (subtotal, tax, shipping, discount, total).
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *
 * @module hooks/features/marketplace/useCheckout
 */

"use client";

import {
    FREE_SHIPPING_THRESHOLD,
    SHIPPING_COST_COP,
    TAX_RATE,
} from "@/lib/constants";
import { MOCK_ADDRESSES } from "@/lib/marketplace-mock";
import { validateCoupon } from "@/services/marketplace-service";
import { useCartStore } from "@/store/cart-store";
import type { Address, CheckoutStep, OrderSummaryData } from "@/types/marketplace";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

const STEPS: CheckoutStep[] = ["resumen", "direccion", "pagar"];

export function useCheckout() {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    /* ── Current step from URL ──────────────────────────────────────── */

    const currentStep: CheckoutStep = useMemo(() => {
        const tab = urlSearchParams.get("tab") as CheckoutStep | null;
        if (tab && STEPS.includes(tab)) return tab;
        return "resumen";
    }, [urlSearchParams]);

    const currentStepIndex = STEPS.indexOf(currentStep);

    const goToStep = useCallback(
        (step: CheckoutStep) => {
            startTransition(() => {
                const params = new URLSearchParams(urlSearchParams.toString());
                params.set("tab", step);
                router.push(`${pathname}?${params.toString()}`, {
                    scroll: false,
                });
            });
        },
        [router, pathname, urlSearchParams, startTransition],
    );

    const goNext = useCallback(() => {
        const next = STEPS[currentStepIndex + 1];
        if (next) goToStep(next);
    }, [currentStepIndex, goToStep]);

    const goBack = useCallback(() => {
        const prev = STEPS[currentStepIndex - 1];
        if (prev) goToStep(prev);
    }, [currentStepIndex, goToStep]);

    /* ── Cart store ─────────────────────────────────────────────────── */

    const {
        items,
        selectedItems,
        selectedSubtotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        shippingAddressId,
        billingAddressId,
        useSameAddress,
        setShippingAddressId,
        setBillingAddressId,
        setUseSameAddress,
        orderNotes,
        setOrderNotes,
        totalItems,
    } = useCartStore();

    /* ── Addresses (mock) ───────────────────────────────────────────── */

    const addresses: Address[] = MOCK_ADDRESSES;

    const shippingAddress = useMemo(
        () => addresses.find((a) => a.id === shippingAddressId) ?? null,
        [addresses, shippingAddressId],
    );

    const billingAddress = useMemo(
        () =>
            useSameAddress
                ? shippingAddress
                : addresses.find((a) => a.id === billingAddressId) ?? null,
        [addresses, billingAddressId, useSameAddress, shippingAddress],
    );

    /* ── Coupon ─────────────────────────────────────────────────────── */

    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    const handleApplyCoupon = useCallback(
        async (code: string) => {
            setCouponLoading(true);
            setCouponError(null);
            try {
                const coupon = await validateCoupon(code);
                if (!coupon) {
                    setCouponError("Cupón no válido o expirado.");
                    return;
                }
                const subtotal = selectedSubtotal();
                if (subtotal < coupon.minOrderAmount) {
                    setCouponError(
                        `El pedido mínimo para este cupón es $${coupon.minOrderAmount.toLocaleString("es-CO")}.`,
                    );
                    return;
                }
                applyCoupon(coupon);
            } finally {
                setCouponLoading(false);
            }
        },
        [selectedSubtotal, applyCoupon],
    );

    /* ── Order summary computation ──────────────────────────────────── */

    const orderSummary: OrderSummaryData = useMemo(() => {
        const subtotal = selectedSubtotal();
        const shippingAmount =
            subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST_COP;

        let discountAmount = 0;
        if (appliedCoupon) {
            if (appliedCoupon.discountType === "percentage") {
                discountAmount = Math.round(
                    subtotal * (appliedCoupon.discountValue / 100),
                );
            } else {
                discountAmount = appliedCoupon.discountValue;
            }
        }

        // IVA is already included in product prices — extract for display only
        const afterDiscount = Math.max(0, subtotal - discountAmount);
        const taxAmount = Math.round(
            afterDiscount * (TAX_RATE / (1 + TAX_RATE)),
        );
        // Total = subtotal - discount + shipping (IVA already in subtotal)
        const total = afterDiscount + shippingAmount;

        return {
            subtotal,
            taxAmount,
            shippingAmount,
            discountAmount,
            total,
            itemCount: totalItems(),
            coupon: appliedCoupon,
        };
    }, [selectedSubtotal, appliedCoupon, totalItems]);

    /* ── Step validation ────────────────────────────────────────────── */

    const canProceedFromResumen = useMemo(() => {
        const selected = selectedItems();
        return selected.length > 0;
    }, [selectedItems]);

    const canProceedFromDireccion = useMemo(() => {
        return !!shippingAddress;
    }, [shippingAddress]);

    const canSubmitOrder = useMemo(() => {
        return canProceedFromResumen && canProceedFromDireccion;
    }, [canProceedFromResumen, canProceedFromDireccion]);

    /* ── Public API ──────────────────────────────────────────────────── */

    return {
        // Steps
        currentStep,
        currentStepIndex,
        steps: STEPS,
        goToStep,
        goNext,
        goBack,
        isPending,

        // Cart data
        items,
        selectedItems: selectedItems(),

        // Addresses
        addresses,
        shippingAddress,
        billingAddress,
        shippingAddressId,
        billingAddressId,
        useSameAddress,
        setShippingAddressId,
        setBillingAddressId,
        setUseSameAddress,

        // Coupon
        appliedCoupon,
        couponLoading,
        couponError,
        handleApplyCoupon,
        removeCoupon,

        // Notes
        orderNotes,
        setOrderNotes,

        // Order summary
        orderSummary,

        // Validation
        canProceedFromResumen,
        canProceedFromDireccion,
        canSubmitOrder,
    };
}
