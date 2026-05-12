/**
 * /cart — Multi-step checkout page.
 *
 * 2-column layout:
 *   Left (main): CheckoutProgress + step content (3 steps)
 *   Right (sticky): OrderSummaryWidget
 *
 * Steps controlled via URL `?tab=resumen|direccion|pagar`.
 * All logic delegated to useCheckout hook.
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 */

"use client";

import { PageHeader } from "@/components/common/PageHeader";
import {
  CheckoutAddressStep,
  CheckoutPaymentStep,
  CheckoutProgress,
  CheckoutSummaryStep,
  OrderSummaryWidget,
} from "@/components/features/marketplace/checkout";
import { useCheckout } from "@/hooks/features/marketplace/useCheckout";
import { Suspense } from "react";

/* ─── Inner component (uses useSearchParams) ────────────────────────────── */

function CheckoutContent() {
  const checkout = useCheckout();

  return (
    <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Checkout"
        breadcrumbs={[
          { label: "Inicio", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: "Checkout" },
        ]}
      />

      {/* Progress */}
      <CheckoutProgress
        currentStep={checkout.currentStep}
        onStepClick={checkout.goToStep}
      />

      {/* 2-column layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: Step content */}
        <div>
          {checkout.currentStep === "resumen" && (
            <CheckoutSummaryStep
              items={checkout.items}
              selectedItems={checkout.selectedItems}
              onContinue={checkout.goNext}
              canContinue={checkout.canProceedFromResumen}
            />
          )}

          {checkout.currentStep === "direccion" && (
            <CheckoutAddressStep
              addresses={checkout.addresses}
              isLoadingAddresses={checkout.isLoadingAddresses}
              shippingAddressId={checkout.shippingAddressId}
              billingAddressId={checkout.billingAddressId}
              useSameAddress={checkout.useSameAddress}
              onShippingChange={checkout.setShippingAddressId}
              onBillingChange={checkout.setBillingAddressId}
              onUseSameAddressChange={checkout.setUseSameAddress}
              onContinue={checkout.goNext}
              onBack={checkout.goBack}
              canContinue={checkout.canProceedFromDireccion}
            />
          )}

          {checkout.currentStep === "pagar" && (
            <CheckoutPaymentStep
              selectedItems={checkout.selectedItems}
              orderSummary={checkout.orderSummary}
              shippingAddress={checkout.shippingAddress}
              orderNotes={checkout.orderNotes}
              onOrderNotesChange={checkout.setOrderNotes}
              onBack={checkout.goBack}
              onSubmitOrder={checkout.submitOrder}
              isSubmittingOrder={checkout.isSubmittingOrder}
              submitOrderError={checkout.submitOrderError}
            />
          )}
        </div>

        {/* Right: Order summary (sticky) */}
        <div className="hidden lg:block">
          <OrderSummaryWidget
            orderSummary={checkout.orderSummary}
            onApplyCoupon={checkout.handleApplyCoupon}
            onRemoveCoupon={checkout.removeCoupon}
            couponLoading={checkout.couponLoading}
            couponError={checkout.couponError}
          />
        </div>
      </div>
    </main>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function CartPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
