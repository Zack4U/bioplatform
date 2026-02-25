"use client";

/**
 * DataCard — versatile card component for catalog items, products, plans, etc.
 * Built on Shadcn Card primitives.
 * WCAG: focusable, keyboard accessible, proper heading level.
 */

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { type ReactNode } from "react";

interface DataCardProps {
    title: string;
    subtitle?: string;
    image?: string | null;
    imageAlt?: string;
    badge?: ReactNode;
    footer?: ReactNode;
    onClick?: () => void;
    href?: string;
    className?: string;
    children?: ReactNode;
}

export function DataCard({
    title,
    subtitle,
    image,
    imageAlt,
    badge,
    footer,
    onClick,
    href,
    className,
    children,
}: DataCardProps) {
    const isInteractive = !!onClick || !!href;

    const cardContent = (
        <Card
            className={cn(
                "group flex flex-col overflow-hidden transition-all",
                isInteractive &&
                    "cursor-pointer hover:shadow-md hover:border-primary/30",
                className,
            )}
        >
            {/* Image */}
            {image && (
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                        src={image}
                        alt={imageAlt ?? title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                    {badge && (
                        <div className="absolute right-2 top-2">{badge}</div>
                    )}
                </div>
            )}

            {/* Content */}
            <CardHeader className="pb-0">
                {!image && badge && <div className="mb-1">{badge}</div>}
                <CardTitle className="line-clamp-2 text-sm leading-snug">
                    {title}
                </CardTitle>
                {subtitle && (
                    <p className="line-clamp-1 text-xs text-muted-foreground italic">
                        {subtitle}
                    </p>
                )}
            </CardHeader>

            {children && (
                <CardContent className="flex-1 pt-0">{children}</CardContent>
            )}

            {/* Footer */}
            {footer && (
                <CardFooter className="border-t pt-3 text-sm">
                    {footer}
                </CardFooter>
            )}
        </Card>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
                {cardContent}
            </Link>
        );
    }

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="w-full text-left rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
                {cardContent}
            </button>
        );
    }

    return cardContent;
}
