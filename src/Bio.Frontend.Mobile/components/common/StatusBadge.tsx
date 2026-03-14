/**
 * StatusBadge — colored badge for entity statuses.
 * Built on RNR Badge primitive with semantic status colors.
 * Reused for conservation status, sync status, permit status, etc.
 */

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
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
 * Map semantic status variants to NativeWind styles.
 */
const statusStyles: Record<BadgeVariant, string> = {
    success: "bg-success/15 border-success/25",
    warning: "bg-warning/15 border-warning/25",
    destructive: "", // Uses RNR's native destructive variant
    info: "bg-info/15 border-info/25",
    default: "", // Uses RNR's native secondary variant
    outline: "", // Uses RNR's native outline variant
};

const statusTextStyles: Record<BadgeVariant, string> = {
    success: "text-success",
    warning: "text-warning-foreground",
    destructive: "text-white",
    info: "text-info",
    default: "text-secondary-foreground",
    outline: "text-foreground",
};

/** Map semantic variant → RNR Badge variant prop */
const rnrVariantMap: Record<
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
            variant={rnrVariantMap[variant]}
            className={cn(statusStyles[variant], className)}
        >
            <Text className={cn("text-xs font-medium", statusTextStyles[variant])}>
                {label}
            </Text>
        </Badge>
    );
}

/**
 * Map conservation status strings to badge variants.
 * Used for species catalog.
 */
export function getConservationStatusVariant(status: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
        "En Peligro Crítico": "destructive",
        "En Peligro": "destructive",
        Vulnerable: "warning",
        "Casi Amenazada": "warning",
        "Preocupación Menor": "success",
        "Datos Insuficientes": "info",
        "No Evaluada": "default",
        // IUCN codes
        CR: "destructive",
        EN: "destructive",
        VU: "warning",
        NT: "warning",
        LC: "success",
        DD: "info",
        NE: "default",
    };
    return map[status] ?? "default";
}

/**
 * Map sync status strings to badge variants.
 * Used for offline-first sync indicators.
 */
export function getSyncStatusVariant(status: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
        synced: "success",
        pending: "warning",
        error: "destructive",
        offline: "info",
    };
    return map[status] ?? "default";
}

/**
 * Map ABS permit status strings to badge variants.
 */
export function getPermitStatusVariant(status: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
        Active: "success",
        Suspended: "warning",
        Expired: "destructive",
        Revoked: "destructive",
    };
    return map[status] ?? "default";
}
