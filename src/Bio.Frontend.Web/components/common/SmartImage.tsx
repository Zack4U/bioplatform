/**
 * SmartImage — unified image component for BioCommerce Caldas.
 *
 * Abstracts the image provider so consumers don't care whether
 * the source is a regular URL (Next.js Image) or a Cloudinary
 * public ID (CldImage from next-cloudinary).
 *
 * Usage
 * ─────
 * // Regular URL → delegates to <Image> from "next/image"
 * <SmartImage src="https://images.unsplash.com/…" alt="…" fill />
 *
 * // Cloudinary public ID → delegates to <CldImage> from "next-cloudinary"
 * <SmartImage provider="cloudinary" src="bio/species/quercus" alt="…" width={600} height={400} />
 *
 * When no `provider` prop is supplied the component auto-detects:
 *   - If NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is set AND the src does NOT
 *     start with "http" → uses Cloudinary.
 *   - Otherwise → uses Next.js Image.
 *
 * WCAG: alt text is required. Decorative images must pass alt="".
 */

"use client";

import { cn } from "@/lib/utils";
import { CldImage, type CldImageProps } from "next-cloudinary";
import NextImage, { type ImageProps as NextImageProps } from "next/image";

/* ─── Provider type ─────────────────────────────────────────────────────── */

export type ImageProvider = "next" | "cloudinary";

/* ─── Cloudinary-specific prop types (re-exported from next-cloudinary) ── */

type CldCrop = CldImageProps["crop"];
type CldGravity = CldImageProps["gravity"];
type CldFormat = CldImageProps["format"];

/* ─── Props ─────────────────────────────────────────────────────────────── */

export interface SmartImageProps extends Omit<
    NextImageProps,
    "loader" | "quality"
> {
    /**
     * Force a specific provider.
     * When omitted the component auto-detects based on src format.
     */
    provider?: ImageProvider;
    /**
     * Image quality (0-100). Works with both providers.
     */
    quality?: number | `${number}`;
    /**
     * Cloudinary-specific: crop mode (ignored for "next" provider).
     * @see https://next.cloudinary.dev/cldimage/configuration
     */
    crop?: CldCrop;
    /** Cloudinary-specific: gravity (ignored for "next" provider). */
    gravity?: CldGravity;
    /** Cloudinary-specific: format override (ignored for "next" provider). */
    format?: CldFormat;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

function isHttpUrl(src: string | undefined): boolean {
    if (!src) return false;
    return src.startsWith("http://") || src.startsWith("https://");
}

function resolveProvider(
    provider: ImageProvider | undefined,
    src: SmartImageProps["src"],
): ImageProvider {
    if (provider) return provider;
    // Auto-detect: if we have a cloud name AND src is NOT an absolute URL → cloudinary
    if (CLOUD_NAME && typeof src === "string" && !isHttpUrl(src)) {
        return "cloudinary";
    }
    return "next";
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function SmartImage({
    provider: providerProp,
    src,
    alt,
    className,
    crop,
    gravity,
    quality,
    format,
    ...rest
}: SmartImageProps) {
    const resolvedProvider = resolveProvider(providerProp, src);

    /* ── Cloudinary ──────────────────────────────────────────────────────── */
    if (resolvedProvider === "cloudinary" && typeof src === "string") {
        return (
            <CldImage
                src={src}
                alt={alt}
                className={className}
                crop={crop}
                gravity={gravity}
                quality={quality}
                format={format}
                {...rest}
            />
        );
    }

    /* ── Next.js Image (default) ─────────────────────────────────────────── */
    return (
        <NextImage
            src={src}
            alt={alt}
            className={cn(className)}
            quality={quality}
            {...rest}
        />
    );
}
