/**
 * useCheckout — multi-step checkout logic hook.
 *
 * Manages the 3-step checkout flow:
 *   1. resumen    — Cart review + item selection
 *   2. direccion  — Shipping & billing address
 *   3. pagar      — Payment & order submission
 *
 * State source: URL `?tab=` for current step, Zustand cart-store for data.
 * Addresses are fetched from the real backend via React Query.
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
import {
  createCheckoutSession,
  createOrder,
  getAddresses,
  validateCoupon,
} from "@/services/marketplace-service";
import { useCartStore } from "@/store/cart-store";
import type {
  Address,
  CheckoutStep,
  CreateOrderRequest,
  OrderSummaryData,
} from "@/types/marketplace";
import { useQuery } from "@tanstack/react-query";
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
    resetCheckout,
    clearCart,
  } = useCartStore();

  /* ── Addresses — real API via React Query ───────────────────────── */

  const {
    data: addresses = [],
    isLoading: isLoadingAddresses,
    isError: isAddressesError,
    refetch: refetchAddresses,
  } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: getAddresses,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const shippingAddress = useMemo(
    () => addresses.find((a) => a.id === shippingAddressId) ?? null,
    [addresses, shippingAddressId],
  );

  const billingAddress = useMemo(
    () =>
      useSameAddress
        ? shippingAddress
        : (addresses.find((a) => a.id === billingAddressId) ?? null),
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
        const subtotal = selectedSubtotal();
        const coupon = await validateCoupon(code, subtotal);
        if (!coupon) {
          setCouponError("Cupon no valido o expirado.");
          return;
        }
        if (subtotal < coupon.minOrderAmount) {
          setCouponError(
            `El pedido minimo para este cupon es $${coupon.minOrderAmount.toLocaleString("es-CO")}.`,
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
    const taxAmount = Math.round(afterDiscount * (TAX_RATE / (1 + TAX_RATE)));
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

  /* ── Submit order ───────────────────────────────────────────────── */

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submitOrderError, setSubmitOrderError] = useState<string | null>(null);

  /**
   * Creates an order and then opens the payment gateway checkout page.
   * On success: clears checkout state and redirects to the payment URL.
   * On error: surfaces a human-readable message without crashing.
   */
  const submitOrder = useCallback(async () => {
    if (!shippingAddressId || !canSubmitOrder) return;

    setIsSubmittingOrder(true);
    setSubmitOrderError(null);

    try {
      const cartItems = selectedItems().map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const orderPayload: CreateOrderRequest = {
        cartItems,
        shippingAddressId,
        billingAddressId: useSameAddress
          ? undefined
          : (billingAddressId ?? undefined),
        useSameAddress,
        orderNotes: orderNotes || undefined,
        couponCode: appliedCoupon?.code || undefined,
      };

      const order = await createOrder(orderPayload);
      const session = await createCheckoutSession(order.id);

      // Clear cart and checkout state before redirecting
      resetCheckout();
      clearCart();

      // Redirect to the PSE / Stripe hosted payment page
      window.location.href = session.checkoutUrl;
    } catch (err: unknown) {
      const message =
        (
          err as {
            response?: { data?: { detail?: string } };
            message?: string;
          }
        )?.response?.data?.detail ??
        (err as { message?: string })?.message ??
        "Error al procesar el pedido. Por favor intenta de nuevo.";
      setSubmitOrderError(message);
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [
    shippingAddressId,
    billingAddressId,
    useSameAddress,
    orderNotes,
    appliedCoupon,
    selectedItems,
    canSubmitOrder,
    resetCheckout,
    clearCart,
  ]);

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
    isLoadingAddresses,
    isAddressesError,
    refetchAddresses,
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

    // Order submission
    submitOrder,
    isSubmittingOrder,
    submitOrderError,
  };
}
