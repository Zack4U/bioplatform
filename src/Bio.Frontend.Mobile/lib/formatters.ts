/**
 * Date formatting utilities.
 * Rule: All dates stored/processed as UTC in backend.
 * Format to local time (Colombia GMT-5) ONLY in the client UI.
 */

import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/** Format an ISO UTC date string to local Colombian display */
export function formatDate(
    dateStr: string,
    pattern = "d 'de' MMM, yyyy",
): string {
    const date = parseISO(dateStr);
    return format(date, pattern, { locale: es });
}

/** Format date with time */
export function formatDateTime(dateStr: string): string {
    const date = parseISO(dateStr);
    return format(date, "d 'de' MMM, yyyy · h:mm a", { locale: es });
}

/** Relative time ("hace 2 horas") */
export function formatRelativeTime(dateStr: string): string {
    const date = parseISO(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

/** Format price in COP */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}…`;
}

/** Generate initials from full name (for avatars) */
export function getInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("");
}

/** Slugify a string */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

const CONSERVATION_STATUS_MAP = {
    CR: { code: "CR", label: "En Peligro Critico", tone: "destructive" },
    EN: { code: "EN", label: "En Peligro", tone: "destructive" },
    VU: { code: "VU", label: "Vulnerable", tone: "warning" },
    NT: { code: "NT", label: "Casi Amenazada", tone: "warning" },
    LC: { code: "LC", label: "Preocupacion Menor", tone: "success" },
    DD: { code: "DD", label: "Datos Insuficientes", tone: "info" },
    NE: { code: "NE", label: "No Evaluada", tone: "default" },
} as const;

export type ConservationStatusTone =
    | "success"
    | "warning"
    | "destructive"
    | "info"
    | "default";

interface ConservationStatusBadgeStyle {
    containerClass: string;
    textClass: string;
}

function extractIucnCode(
    raw: string,
): keyof typeof CONSERVATION_STATUS_MAP | null {
    const trimmed = raw.trim().toUpperCase();

    if (trimmed in CONSERVATION_STATUS_MAP) {
        return trimmed as keyof typeof CONSERVATION_STATUS_MAP;
    }

    const parenMatch = raw.match(/\(([A-Z]{2})\)/);
    if (parenMatch && parenMatch[1] in CONSERVATION_STATUS_MAP) {
        return parenMatch[1] as keyof typeof CONSERVATION_STATUS_MAP;
    }

    const dashMatch = raw.match(/^([A-Z]{2})\s*[-–—]/);
    if (dashMatch && dashMatch[1] in CONSERVATION_STATUS_MAP) {
        return dashMatch[1] as keyof typeof CONSERVATION_STATUS_MAP;
    }

    const lowerRaw = raw.toLowerCase().trim();
    for (const [code, entry] of Object.entries(CONSERVATION_STATUS_MAP)) {
        if (entry.label.toLowerCase() === lowerRaw) {
            return code as keyof typeof CONSERVATION_STATUS_MAP;
        }
    }

    return null;
}

/** Format conservation status to a human-readable IUCN label. */
export function formatConservationStatus(
    raw: string | null | undefined,
): string {
    if (!raw) return "No disponible";

    const code = extractIucnCode(raw);
    if (!code) return raw;

    const entry = CONSERVATION_STATUS_MAP[code];
    return `${entry.code} - ${entry.label}`;
}

/** Resolve semantic tone from a raw conservation status value. */
export function getConservationStatusTone(
    raw: string | null | undefined,
): ConservationStatusTone {
    if (!raw) return "default";

    const code = extractIucnCode(raw);
    if (!code) return "default";

    return CONSERVATION_STATUS_MAP[code].tone;
}

/** Shared badge styles for conservation status across the app. */
export function getConservationStatusBadgeStyle(
    raw: string | null | undefined,
): ConservationStatusBadgeStyle {
    const tone = getConservationStatusTone(raw);

    if (tone === "destructive") {
        return {
            containerClass: "bg-destructive/15",
            textClass: "text-destructive",
        };
    }

    if (tone === "warning") {
        return {
            containerClass: "bg-warning/15",
            textClass: "text-warning",
        };
    }

    if (tone === "success") {
        return {
            containerClass: "bg-success/15",
            textClass: "text-success",
        };
    }

    if (tone === "info") {
        return {
            containerClass: "bg-info/15",
            textClass: "text-info",
        };
    }

    return {
        containerClass: "bg-muted",
        textClass: "text-muted-foreground",
    };
}
