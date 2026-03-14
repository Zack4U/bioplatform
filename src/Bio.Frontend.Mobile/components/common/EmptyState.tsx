/**
 * EmptyState — shown when lists/grids have no data.
 * Built on RNR Card primitive.
 * Reusable across species catalog, search results, sync history, etc.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";
import { View } from "react-native";

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
            className={cn("border-dashed shadow-none", className)}
            accessibilityRole="summary"
        >
            <CardContent className="flex items-center justify-center gap-4 p-10">
                {icon && (
                    <View className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        {icon}
                    </View>
                )}
                <View className="items-center gap-1.5">
                    <Text className="text-lg font-semibold text-center">
                        {title}
                    </Text>
                    {description && (
                        <Text className="text-sm text-muted-foreground text-center max-w-[280px]">
                            {description}
                        </Text>
                    )}
                </View>
                {action && <View className="mt-2">{action}</View>}
            </CardContent>
        </Card>
    );
}
