"use client";

/**
 * EmptyState — shown when lists/grids have no data.
 * Built on Shadcn Card primitive.
 * Reusable across catalog, marketplace, dashboard, etc.
 * WCAG: informative message with optional action CTA.
 */

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <Card
            role="status"
            className={cn("border-dashed shadow-none", className)}
        >
            <CardContent className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                {icon && (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {icon}
                    </div>
                )}
                <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {description && (
                        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {action && <div className="mt-2">{action}</div>}
            </CardContent>
        </Card>
    );
}
