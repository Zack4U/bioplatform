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
