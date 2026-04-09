/**
 * Normalize remote image URLs for mobile rendering.
 *
 * - Handles protocol-relative URLs (//host/path)
 * - Encodes spaces and unsafe characters
 */
export function normalizeImageUrl(
    raw: string | null | undefined,
): string | null {
    if (!raw) return null;

    const trimmed = raw.trim();
    if (!trimmed) return null;

    let normalized = trimmed;

    if (normalized.startsWith("//")) {
        normalized = `https:${normalized}`;
    }

    try {
        const url = new URL(normalized);
        if (
            url.protocol === "http:" &&
            (url.hostname === "upload.wikimedia.org" ||
                url.hostname.endsWith(".wikimedia.org"))
        ) {
            url.protocol = "https:";
        }
        return encodeURI(url.toString());
    } catch {
        return encodeURI(normalized);
    }
}
