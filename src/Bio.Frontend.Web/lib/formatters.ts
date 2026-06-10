/**
 * Date formatting utilities.
 * Rule: All dates stored/processed as UTC in backend.
 * Format to local time (Colombia GMT-5) ONLY in the client UI.
 */

import { format, parseISO } from "date-fns";
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

/**
 * Relative time with clean Spanish labels — no verbose date-fns strings.
 *
 * - < 60 s    → "hace menos de un minuto"
 * - < 60 min  → "hace X minuto(s)"
 * - < 24 h    → "hace X hora(s)"
 * - < 7 days  → "hace X día(s)"
 * - ≥ 7 days  → "DD/MM/YYYY"
 */
export function formatRelativeTime(dateStr: string): string {
    const date = parseISO(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "hace menos de un minuto";
    if (diffMin < 60) return diffMin === 1 ? "hace 1 minuto" : `hace ${diffMin} minutos`;
    if (diffHour < 24) return diffHour === 1 ? "hace 1 hora" : `hace ${diffHour} horas`;
    if (diffDay < 7) return diffDay === 1 ? "hace 1 día" : `hace ${diffDay} días`;
    return format(date, "d/M/yyyy");
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

/** Strip all HTML tags from a string (for displaying rich-text content as plain text) */
export function stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
}

/* ─── Conservation Status (IUCN Red List) ─────────────────────────────── */

/**
 * IUCN Red List conservation status codes → Spanish labels.
 * Ordered from most critical to least concern.
 */
export const CONSERVATION_STATUS_MAP: Record<
    string,
    { code: string; label: string; color: string }
> = {
    EX: { code: "EX", label: "Extinta", color: "bg-black text-white" },
    EW: {
        code: "EW",
        label: "Extinta en Estado Silvestre",
        color: "bg-gray-900 text-white",
    },
    CR: {
        code: "CR",
        label: "En Peligro Crítico",
        color: "bg-red-700 text-white",
    },
    EN: {
        code: "EN",
        label: "En Peligro",
        color: "bg-orange-600 text-white",
    },
    VU: {
        code: "VU",
        label: "Vulnerable",
        color: "bg-amber-500 text-white",
    },
    NT: {
        code: "NT",
        label: "Casi Amenazada",
        color: "bg-yellow-500 text-black",
    },
    LC: {
        code: "LC",
        label: "Preocupación Menor",
        color: "bg-green-600 text-white",
    },
    DD: {
        code: "DD",
        label: "Datos Insuficientes",
        color: "bg-gray-400 text-white",
    },
    NE: {
        code: "NE",
        label: "No Evaluada",
        color: "bg-gray-500 text-white",
    },
};

/**
 * Extract the IUCN code from a raw conservation status string.
 *
 * Handles multiple formats:
 *   - "VU"                    → "VU"
 *   - "Vulnerable (VU)"      → "VU"
 *   - "En Peligro (EN)"      → "EN"
 *   - "VU - Vulnerable"      → "VU"
 *   - "vulnerable"           → "VU" (case-insensitive label match)
 */
function extractIucnCode(raw: string): string | null {
    const trimmed = raw.trim().toUpperCase();

    // Direct code match (e.g. "VU", "EN")
    if (CONSERVATION_STATUS_MAP[trimmed]) return trimmed;

    // Parenthetical — "Vulnerable (VU)" or "En Peligro Crítico (CR)"
    const parenMatch = raw.match(/\(([A-Z]{2})\)/);
    if (parenMatch && CONSERVATION_STATUS_MAP[parenMatch[1]]) return parenMatch[1];

    // Dash separator — "VU - Vulnerable"
    const dashMatch = raw.match(/^([A-Z]{2})\s*[-–—]/);
    if (dashMatch && CONSERVATION_STATUS_MAP[dashMatch[1]]) return dashMatch[1];

    // Case-insensitive label match
    const lowerRaw = raw.toLowerCase().trim();
    for (const [code, entry] of Object.entries(CONSERVATION_STATUS_MAP)) {
        if (entry.label.toLowerCase() === lowerRaw) return code;
    }

    return null;
}

/**
 * Format a raw conservation status string into a human-readable label.
 *
 * @example
 *   formatConservationStatus("VU")               → "VU — Vulnerable"
 *   formatConservationStatus("En Peligro (EN)")   → "EN — En Peligro"
 *   formatConservationStatus(null)                → "No disponible"
 *   formatConservationStatus("Unknown")           → "Unknown"
 */
export function formatConservationStatus(raw: string | null | undefined): string {
    if (!raw) return "No disponible";

    const code = extractIucnCode(raw);
    if (!code) return raw; // Unknown value — return as-is

    const entry = CONSERVATION_STATUS_MAP[code];
    return `${entry.code} — ${entry.label}`;
}

/**
 * Get the color class for a conservation status badge.
 *
 * @returns Tailwind class string for background + text color
 */
export function getConservationStatusColor(raw: string | null | undefined): string {
    if (!raw) return "bg-gray-500 text-white";

    const code = extractIucnCode(raw);
    if (!code) return "bg-gray-500 text-white";

    return CONSERVATION_STATUS_MAP[code].color;
}

