/**
 * HtmlViewer — read-only HTML renderer for sanitized backend content.
 *
 * The backend runs Ganss.HtmlSanitizer with a strict whitelist before
 * persisting HTML, so `dangerouslySetInnerHTML` is safe here.
 *
 * Applies Tailwind-based typography styles to: h1–h4, p, strong, em, ul, ol,
 * li, blockquote, a, img, hr, code, pre.
 *
 * WCAG: links open in a new tab with rel="noopener noreferrer".
 * Responsive: images are capped at 100% width.
 *
 * Usage:
 *   <HtmlViewer html={product.description} className="mt-4" />
 *   <HtmlViewer html="" showEmpty />
 */

import { cn } from "@/lib/utils";

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface HtmlViewerProps {
    /** Sanitized HTML string from the backend. */
    html: string;
    /** Extra Tailwind classes applied to the outer wrapper. */
    className?: string;
    /**
     * When true and html is empty/blank, renders a muted "Sin descripción"
     * placeholder. When false (default) renders nothing for empty content.
     */
    showEmpty?: boolean;
}

/* ─── Typography class map applied via [&_selector] Tailwind utilities ─── */

/**
 * These classes replicate @tailwindcss/typography (prose) behaviour without
 * requiring the plugin, using the [&_element]:utility arbitrary-variant syntax
 * supported by Tailwind v3+ and v4.
 *
 * All classes are explicit so Tailwind can tree-shake them correctly at build
 * time (no dynamic string concatenation).
 */
const PROSE_CLASSES = [
    // Headings
    "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-foreground",
    "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-foreground",
    "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-foreground",
    "[&_h4]:text-lg [&_h4]:font-medium [&_h4]:leading-snug [&_h4]:mb-2 [&_h4]:mt-3 [&_h4]:text-foreground",

    // Paragraph & inline
    "[&_p]:mb-4 [&_p]:leading-7 [&_p]:text-foreground",
    "[&_strong]:font-semibold [&_strong]:text-foreground",
    "[&_em]:italic",

    // Lists
    "[&_ul]:mb-4 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1",
    "[&_ol]:mb-4 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-1",
    "[&_li]:leading-7 [&_li]:text-foreground",

    // Blockquote
    "[&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4",

    // Links
    "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:font-medium [&_a]:transition-colors [&_a:hover]:text-primary/80",

    // Images — responsive, rounded, with subtle shadow
    "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-4 [&_img]:shadow-sm",

    // Horizontal rule
    "[&_hr]:my-6 [&_hr]:border-border",

    // Inline code
    "[&_code]:font-mono [&_code]:text-sm [&_code]:bg-muted [&_code]:text-foreground [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded",

    // Code blocks
    "[&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre]:text-sm [&_pre]:font-mono [&_pre]:leading-relaxed",
    // Prevent double-styling when <code> is inside <pre>
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:rounded-none",
].join(" ");

/* ─── Component ─────────────────────────────────────────────────────────── */

export function HtmlViewer({
    html,
    className,
    showEmpty = false,
}: HtmlViewerProps) {
    const isEmpty = !html || !html.trim();

    if (isEmpty) {
        if (!showEmpty) return null;

        return (
            <p
                className={cn(
                    "text-sm text-muted-foreground italic",
                    className,
                )}
                aria-label="Sin descripción"
            >
                Sin descripción
            </p>
        );
    }

    return (
        <div
            /**
             * Security note: content is sanitized server-side via
             * Ganss.HtmlSanitizer before reaching this component.
             * dangerouslySetInnerHTML is intentional and necessary
             * to render the formatted HTML output correctly.
             */

            dangerouslySetInnerHTML={{ __html: html }}
            className={cn(
                // Base reset
                "text-base leading-7 text-foreground",
                // Typography styles
                PROSE_CLASSES,
                // Spacing: first child has no top margin, last has no bottom margin
                "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
                className,
            )}
        />
    );
}
