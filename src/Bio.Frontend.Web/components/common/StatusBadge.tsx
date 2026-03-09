"use client";

/**
 * StatusBadge — colored badge for entity statuses.
 * Built on Shadcn Badge primitive with semantic status colors.
 * Reused in products, orders, permits, etc.
 * WCAG: color + text label for accessibility.
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant =
    | "success"
    | "warning"
    | "destructive"
    | "info"
    | "default"
    | "outline";

interface StatusBadgeProps {
    label: string;
    variant?: BadgeVariant;
    className?: string;
}

/**
 * Map semantic status variants to Shadcn Badge visual styles.
 * Uses custom CSS classes for success/warning/info semantic colors.
 */
const statusStyles: Record<BadgeVariant, string> = {
    success: "bg-success/15 text-success border-success/25 hover:bg-success/25",
    warning:
        "bg-warning/15 text-warning-foreground border-warning/25 hover:bg-warning/25",
    destructive: "", // Uses Shadcn's native destructive variant
    info: "bg-info/15 text-info border-info/25 hover:bg-info/25",
    default: "", // Uses Shadcn's native secondary variant
    outline: "", // Uses Shadcn's native outline variant
};

/** Map semantic variant → Shadcn Badge variant prop */
const shadcnVariantMap: Record<
    BadgeVariant,
    "default" | "secondary" | "destructive" | "outline"
> = {
    success: "outline",
    warning: "outline",
    destructive: "destructive",
    info: "outline",
    default: "secondary",
    outline: "outline",
};

export function StatusBadge({
    label,
    variant = "default",
    className,
}: StatusBadgeProps) {
    return (
        <Badge
            variant={shadcnVariantMap[variant]}
            className={cn(statusStyles[variant], className)}
        >
            {label}
        </Badge>
    );
}

/**
 * Map known status strings to badge variants — use in feature components.
 */
export function getOrderStatusVariant(status: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
        Pending: "warning",
        Paid: "success",
        Processing: "info",
        Shipped: "info",
        Delivered: "success",
        Cancelled: "destructive",
        Refunded: "warning",
    };
    return map[status] ?? "default";
}

export function getPermitStatusVariant(status: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
        Active: "success",
        Suspended: "warning",
        Expired: "destructive",
        Revoked: "destructive",
    };
    return map[status] ?? "default";
}

export function getProductStatusVariant(status: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
        Active: "success",
        Draft: "default",
        OutOfStock: "warning",
        Suspended: "destructive",
    };
    return map[status] ?? "default";
}
