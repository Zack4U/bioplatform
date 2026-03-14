/**
 * DataCard — versatile card component for species items, observations, etc.
 * Built on RNR Card primitives.
 * Adapted for mobile: uses Pressable for touch interaction and Image for thumbnails.
 */

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";
import { Image, Pressable, View } from "react-native";

interface DataCardProps {
    title: string;
    subtitle?: string;
    image?: string | null;
    imageAlt?: string;
    badge?: ReactNode;
    footer?: ReactNode;
    onPress?: () => void;
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
    onPress,
    className,
    children,
}: DataCardProps) {
    const cardContent = (
        <Card className={cn("overflow-hidden", image && "pt-0", className)}>
            {/* Image */}
            {image && (
                <View className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <Image
                        source={{ uri: image }}
                        className="h-full w-full"
                        resizeMode="cover"
                        accessibilityLabel={imageAlt ?? title}
                    />
                    {badge && (
                        <View className="absolute right-2 top-2">{badge}</View>
                    )}
                </View>
            )}

            {/* Content */}
            <CardHeader className="pb-0">
                {!image && badge && <View className="mb-1">{badge}</View>}
                <CardTitle className="text-sm leading-snug" numberOfLines={2}>
                    {title}
                </CardTitle>
                {subtitle && (
                    <Text
                        className="text-xs text-muted-foreground italic"
                        numberOfLines={1}
                    >
                        {subtitle}
                    </Text>
                )}
            </CardHeader>

            {children && (
                <CardContent className="flex-1 pt-0">{children}</CardContent>
            )}

            {/* Footer */}
            {footer && (
                <CardFooter className="border-t border-border pt-3">
                    {footer}
                </CardFooter>
            )}
        </Card>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                className="active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel={title}
            >
                {cardContent}
            </Pressable>
        );
    }

    return cardContent;
}
