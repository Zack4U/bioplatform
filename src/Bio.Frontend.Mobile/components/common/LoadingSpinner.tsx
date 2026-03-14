/**
 * LoadingSpinner — consistent loading indicator for React Native.
 * Uses RNR Text component. Accessible via accessibilityRole.
 */

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { ActivityIndicator, View } from "react-native";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    label?: string;
    className?: string;
    fullScreen?: boolean;
    /** Use native ActivityIndicator instead of Lucide icon */
    native?: boolean;
}

const sizeMap = {
    sm: 16,
    md: 32,
    lg: 48,
} as const;

export function LoadingSpinner({
    size = "md",
    label = "Cargando...",
    className,
    fullScreen = false,
    native = false,
}: LoadingSpinnerProps) {
    const { colorScheme } = useColorScheme();
    const iconSize = sizeMap[size];

    const content = (
        <View
            className={cn(
                "flex items-center justify-center gap-3",
                className,
            )}
            accessibilityRole="progressbar"
            accessibilityLabel={label}
        >
            {native ? (
                <ActivityIndicator
                    size={size === "sm" ? "small" : "large"}
                    color={
                        colorScheme === "dark"
                            ? "hsl(149 50% 50%)"
                            : "hsl(149 70% 35%)"
                    }
                />
            ) : (
                <Loader2
                    size={iconSize}
                    className="animate-spin text-primary"
                    color={
                        colorScheme === "dark"
                            ? "hsl(149, 50%, 50%)"
                            : "hsl(149, 70%, 35%)"
                    }
                />
            )}
            {size !== "sm" && (
                <Text className="text-sm text-muted-foreground">{label}</Text>
            )}
        </View>
    );

    if (fullScreen) {
        return (
            <View className="flex-1 items-center justify-center">{content}</View>
        );
    }

    return content;
}
