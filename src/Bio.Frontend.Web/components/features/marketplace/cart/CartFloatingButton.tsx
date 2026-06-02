/**
 * CartFloatingButton — persistent floating action button for the cart.
 *
 * Bottom-right corner, shows item count badge.
 * Clicking toggles the CartPreview panel.
 * Hides on /cart page (checkout already shows the full cart).
 * Hydration-safe — waits for client mount before showing store data.
 */

"use client";

import { Button } from "@/components/ui/button";
import { useHydration } from "@/hooks/useHydration";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";

export function CartFloatingButton() {
    const isHydrated = useHydration();
    const cartCountValue = useCartStore((s) =>
        s.items.reduce((sum, item) => sum + item.quantity, 0),
    );
    const toggleCart = useCartStore((s) => s.toggleCart);
    const pathname = usePathname();

    // Only show on home page or marketplace pages
    const showCart = pathname === "/" || pathname === "/marketplace" || pathname.startsWith("/marketplace/");
    if (!showCart) return null;

    const count = isHydrated ? cartCountValue : 0;

    return (
        <Button
            id="cart-floating-btn"
            onClick={toggleCart}
            size="lg"
            className={cn(
                "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "transition-all duration-300 hover:scale-105 hover:shadow-xl",
                count === 0 && "opacity-0 pointer-events-none scale-75",
            )}
            aria-label={`Carrito de compras: ${count} articulo${count !== 1 ? "s" : ""}`}
        >
            <ShoppingCart className="h-6 w-6" aria-hidden="true" />
            {count > 0 && (
                <span
                    className={cn(
                        "absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center",
                        "rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground",
                        "animate-in zoom-in-50 duration-200",
                    )}
                >
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </Button>
    );
}
