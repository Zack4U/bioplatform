"use client";

/**
 * PageHeader — consistent page title section with breadcrumbs.
 * Built on Shadcn Separator primitive.
 * Used across all pages for visual consistency.
 * WCAG: proper heading hierarchy, breadcrumb nav landmark.
 */

import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { type ReactNode } from "react";

interface BreadcrumbLink {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: BreadcrumbLink[];
    actions?: ReactNode;
}

export function PageHeader({
    title,
    description,
    breadcrumbs,
    actions,
}: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 pb-6">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="text-sm">
                    <ol className="flex items-center gap-1.5 text-muted-foreground">
                        {breadcrumbs.map((crumb, index) => (
                            <li
                                key={crumb.label}
                                className="flex items-center gap-1.5"
                            >
                                {index > 0 && (
                                    <Separator
                                        orientation="vertical"
                                        className="h-4"
                                    />
                                )}
                                {crumb.href ? (
                                    <Link
                                        href={crumb.href}
                                        className="transition-colors hover:text-foreground focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span
                                        aria-current="page"
                                        className="font-medium text-foreground"
                                    >
                                        {crumb.label}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-muted-foreground">{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2">{actions}</div>
                )}
            </div>
        </div>
    );
}
