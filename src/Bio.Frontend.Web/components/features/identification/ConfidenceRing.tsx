/**
 * ConfidenceRing — circular SVG confidence indicator.
 *
 * Renders an animated ring with a percentage label inside.
 * Color changes based on confidence level:
 *   - Green  (≥80%) — high confidence
 *   - Amber  (50-79%) — moderate confidence
 *   - Red    (<50%) — low confidence
 *
 * @module components/features/identification/ConfidenceRing
 */

"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ConfidenceRingProps {
    /** Confidence value (0 to 1) */
    value: number;
    /** Size of the ring in pixels */
    size?: number;
    /** Stroke width */
    strokeWidth?: number;
    /** Additional class names */
    className?: string;
}

export function ConfidenceRing({
    value,
    size = 120,
    strokeWidth = 6,
    className,
}: ConfidenceRingProps) {
    const [animatedValue, setAnimatedValue] = useState(0);
    const percentage = Math.round(value * 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedValue / 100) * circumference;

    // Animate on mount
    useEffect(() => {
        const timer = setTimeout(() => setAnimatedValue(percentage), 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    // Color based on confidence level
    const getColor = () => {
        if (percentage >= 80) return { stroke: "hsl(142, 71%, 45%)", text: "text-green-500" };
        if (percentage >= 50) return { stroke: "hsl(38, 92%, 50%)", text: "text-amber-500" };
        return { stroke: "hsl(0, 84%, 60%)", text: "text-red-500" };
    };

    const colors = getColor();

    return (
        <div
            className={cn("relative inline-flex items-center justify-center", className)}
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted-foreground/20"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            {/* Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-2xl font-bold", colors.text)}>
                    {percentage}%
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Precision
                </span>
            </div>
        </div>
    );
}
