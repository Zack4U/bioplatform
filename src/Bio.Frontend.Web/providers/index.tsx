"use client";

/**
 * Root providers — composes all context providers in the correct order.
 * Mounted once in the root layout.
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <QueryProvider>
                <TooltipProvider>{children}</TooltipProvider>
                <Toaster
                    position="top-right"
                    expand={false}
                    richColors
                    closeButton
                    toastOptions={{
                        className: "font-sans",
                        duration: 4000,
                    }}
                />
            </QueryProvider>
        </ThemeProvider>
    );
}
