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
        <Card className={cn("gap-0", className)}>
            <CardContent className="flex flex-col gap-2 pt-5">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                        {label}
                    </span>
                    {icon && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                            {icon}
                        </div>
                    )}
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold tracking-tight">
                        {value}
                    </span>
                    {trend && (
                        <span
                            className={cn(
                                "mb-0.5 flex items-center gap-0.5 text-xs font-medium",
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
            </CardContent>
        </Card>
    );
}
