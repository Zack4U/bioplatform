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

        // Prefer HTTPS for remote image hosts (mobile networks often block/redirect HTTP).
        const isLocalHost =
            url.hostname === "localhost" ||
            url.hostname === "127.0.0.1" ||
            url.hostname.startsWith("10.") ||
            url.hostname.startsWith("192.168.") ||
            /^172\.(1[6-9]|2\d|3[0-1])\./.test(url.hostname);

        if (url.protocol === "http:" && !isLocalHost) {
            url.protocol = "https:";
        }

        return encodeURI(url.toString());
    } catch {
        return encodeURI(normalized);
    }
}

/**
 * Build prioritized candidate URLs for resilient image loading.
 * First URL should be attempted first; subsequent URLs are fallback options.
 */
export function buildImageCandidates(raw: string | null | undefined): string[] {
    const primary = normalizeImageUrl(raw);
    if (!primary) return [];

    const candidates: string[] = [];

    const pushUnique = (value: string | null | undefined) => {
        if (!value) return;
        if (!candidates.includes(value)) {
            candidates.push(value);
        }
    };

    pushUnique(primary);

    try {
        const url = new URL(primary);

        if (
            url.hostname === "upload.wikimedia.org" &&
            url.pathname.includes("/wikipedia/commons/thumb/")
        ) {
            const deThumbPath = url.pathname.replace(
                /\/wikipedia\/commons\/thumb\/(.+?)\/[^/]+$/,
                "/wikipedia/commons/$1",
            );

            if (deThumbPath !== url.pathname) {
                const original = `${url.protocol}//${url.host}${deThumbPath}`;
                pushUnique(encodeURI(original));
            }
        }

        if (url.protocol === "https:") {
            const httpVariant = `${"http:"}//${url.host}${url.pathname}${url.search}`;
            pushUnique(encodeURI(httpVariant));
        }
    } catch {
        // Ignore malformed candidates; primary already returned.
    }

    return candidates;
}
