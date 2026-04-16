/**
 * CheckoutProgress — 3-step progress indicator for the checkout flow.
 *
 * Steps: Resumen → Dirección → Pagar
 * Active step highlighted, completed steps show checkmark.
 */

"use client";

import { cn } from "@/lib/utils";
import type { CheckoutStep } from "@/types/marketplace";
import { Check, CreditCard, MapPin, ShoppingCart } from "lucide-react";

interface CheckoutProgressProps {
    currentStep: CheckoutStep;
    onStepClick: (step: CheckoutStep) => void;
}

const STEP_CONFIG = [
    {
        id: "resumen" as CheckoutStep,
        label: "Resumen",
        icon: ShoppingCart,
    },
    {
        id: "direccion" as CheckoutStep,
        label: "Dirección",
        icon: MapPin,
    },
    {
        id: "pagar" as CheckoutStep,
        label: "Pagar",
        icon: CreditCard,
    },
];

export function CheckoutProgress({
    currentStep,
    onStepClick,
}: CheckoutProgressProps) {
    const currentIndex = STEP_CONFIG.findIndex((s) => s.id === currentStep);

    return (
        <nav aria-label="Progreso del checkout" className="mb-8">
            <ol className="flex items-center justify-center gap-2 sm:gap-4">
                {STEP_CONFIG.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const Icon = step.icon;

                    return (
                        <li key={step.id} className="flex items-center gap-2 sm:gap-4">
                            {/* Connector line */}
                            {index > 0 && (
                                <div
                                    className={cn(
                                        "h-0.5 w-8 sm:w-16 transition-colors duration-300",
                                        isCompleted || isCurrent
                                            ? "bg-primary"
                                            : "bg-muted",
                                    )}
                                />
                            )}

                            {/* Step circle + label */}
                            <button
                                type="button"
                                onClick={() => onStepClick(step.id)}
                                disabled={index > currentIndex}
                                className={cn(
                                    "flex flex-col items-center gap-1.5 transition-all duration-200",
                                    index > currentIndex
                                        ? "cursor-not-allowed opacity-50"
                                        : "cursor-pointer",
                                )}
                                aria-label={`Paso ${index + 1}: ${step.label}`}
                                aria-current={
                                    isCurrent ? "step" : undefined
                                }
                            >
                                <div
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                                        isCompleted &&
                                            "border-primary bg-primary text-primary-foreground",
                                        isCurrent &&
                                            "border-primary bg-primary/10 text-primary scale-110",
                                        !isCompleted &&
                                            !isCurrent &&
                                            "border-muted bg-muted/50 text-muted-foreground",
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <Icon className="h-5 w-5" />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-xs font-medium",
                                        isCurrent
                                            ? "text-primary"
                                            : isCompleted
                                              ? "text-foreground"
                                              : "text-muted-foreground",
                                    )}
                                >
                                    {step.label}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
