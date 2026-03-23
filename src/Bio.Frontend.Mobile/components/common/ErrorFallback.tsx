/**
 * ErrorFallback — displayed for API errors, network failures, etc.
 * Built on RNR Card + Button primitives.
 * Also usable as a standalone error state for query failures.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { View } from "react-native";

interface ErrorFallbackProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorFallback({
    title = "Algo salió mal",
    message = "Ocurrió un error inesperado. Por favor, intenta de nuevo.",
    onRetry,
    className,
}: ErrorFallbackProps) {
    const { colorScheme } = useColorScheme();

    return (
        <Card
            className={cn("border-destructive/20 shadow-none", className)}
            accessibilityRole="alert"
        >
            <CardContent className="flex items-center justify-center gap-4 p-8">
                <View className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle
                        size={28}
                        color={
                            colorScheme === "dark"
                                ? "hsl(0, 60%, 50%)"
                                : "hsl(0, 84%, 60%)"
                        }
                    />
                </View>
                <View className="items-center gap-1.5">
                    <Text className="text-lg font-semibold text-center">
                        {title}
                    </Text>
                    <Text className="text-sm text-muted-foreground text-center max-w-[300px]">
                        {message}
                    </Text>
                </View>
                {onRetry && (
                    <Button onPress={onRetry}>
                        <Text>Intentar de nuevo</Text>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
