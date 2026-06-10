"use client";

/**
 * ErrorBoundaryFallback — displayed when a React error boundary catches.
 * Built on Shadcn Button + Card primitives.
 * Also usable as a standalone error state for query failures.
 * WCAG: clear error message with recovery action.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface ErrorFallbackProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorFallback({
    title = "Algo salió mal",
    message = "Ocurrió un error inesperado. Por favor, intenta de nuevo.",
    onRetry,
    className,
}: ErrorFallbackProps) {
    return (
        <Card
            role="alert"
            className={cn(
                "border-destructive/20 bg-destructive/5 shadow-none",
                className,
            )}
        >
            <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle
                        className="h-7 w-7 text-destructive"
                        aria-hidden="true"
                    />
                </div>
                <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                        {message}
                    </p>
                </div>
                {onRetry && (
                    <Button onClick={onRetry}>Intentar de nuevo</Button>
                )}
            </CardContent>
        </Card>
    );
}
