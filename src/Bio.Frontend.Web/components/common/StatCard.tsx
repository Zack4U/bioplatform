"use client";

/**
 * StatCard — metric display card for dashboards.
 * Built on Shadcn Card primitives.
 * Shows a value, label, trend, and optional icon.
 */

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { type ReactNode } from "react";

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
        value: number;
        label?: string;
    };
    className?: string;
}

export function StatCard({
    label,
    value,
    icon,
    trend,
    className,
}: StatCardProps) {
    const isPositive = trend && trend.value >= 0;

    return (
        <Card className={cn("gap-2", className)}>
            <CardContent className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground">
                        {label}
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight">
                            {value}
                        </span>
                        {trend && (
                            <span
                                className={cn(
                                    "flex items-center gap-0.5 text-xs font-medium",
                                    isPositive
                                        ? "text-success"
                                        : "text-destructive",
                                )}
                            >
                                {isPositive ? (
                                    <TrendingUp
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <TrendingDown
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                    />
                                )}
                                {Math.abs(trend.value)}%
                                {trend.label && (
                                    <span className="text-muted-foreground">
                                        {" "}
                                        {trend.label}
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                </div>
                {icon && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        {icon}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
