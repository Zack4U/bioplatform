"use client";

/**
 * LoadingSpinner — consistent loading indicator.
 * WCAG: announces loading state to screen readers.
 */

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    label?: string;
    className?: string;
    fullPage?: boolean;
}

const sizeMap = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
} as const;

export function LoadingSpinner({
    size = "md",
    label = "Cargando...",
    className,
    fullPage = false,
}: LoadingSpinnerProps) {
    const content = (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "flex flex-col items-center justify-center gap-3",
                className,
            )}
        >
            <Loader2
                className={cn("animate-spin text-primary", sizeMap[size])}
            />
            <span className="sr-only">{label}</span>
            {size !== "sm" && (
                <p className="text-sm text-muted-foreground">{label}</p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                {content}
            </div>
        );
    }

    return content;
}
