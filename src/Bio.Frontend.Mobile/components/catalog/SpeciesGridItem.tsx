/**
 * SpeciesGridItem — Compact square card for grid mode in the species catalog.
 */

import { SmartImage } from "@/components/common/SmartImage";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { normalizeImageUrl } from "@/lib/image-url";
import { THEME } from "@/lib/theme";
import type { SpeciesListItem } from "@/types";
import { Leaf, Shield } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

interface SpeciesGridItemProps {
    item: SpeciesListItem;
    width: number;
    onPress?: () => void;
}

export function SpeciesGridItem({
    item,
    width,
    onPress,
}: SpeciesGridItemProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const [imageFailed, setImageFailed] = useState(false);

    const kingdom = item.kingdom;
    const imageUri = normalizeImageUrl(item.thumbnailUrl);
    const canShowImage = Boolean(imageUri) && !imageFailed;

    useEffect(() => {
        setImageFailed(false);
    }, [imageUri]);

    return (
        <Pressable
            className="active:opacity-80 mb-3"
            style={{ width }}
            onPress={onPress}
        >
            <View className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Thumbnail area */}
                <View className="aspect-square bg-muted items-center justify-center overflow-hidden">
                    {canShowImage ? (
                        <SmartImage
                            source={{ uri: imageUri as string }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            onError={() => setImageFailed(true)}
                        />
                    ) : item.isSensitive ? (
                        <Shield
                            size={28}
                            color={theme.warning}
                            strokeWidth={1.2}
                        />
                    ) : (
                        <Leaf
                            size={28}
                            color={theme.mutedForeground}
                            strokeWidth={1.2}
                        />
                    )}
                </View>
                {/* Info */}
                <View className="p-2.5">
                    <Text
                        className="text-xs font-semibold text-foreground"
                        numberOfLines={1}
                    >
                        {item.scientificName}
                    </Text>
                    <Text
                        className="text-[10px] text-muted-foreground mt-0.5"
                        numberOfLines={1}
                    >
                        {item.commonName ?? item.family ?? "—"}
                    </Text>
                    <View className="flex-row items-center mt-1.5">
                        <Badge variant="secondary" className="px-1.5 py-0.5">
                            <Text className="text-[9px]">{kingdom ?? "—"}</Text>
                        </Badge>
                        {item.isSensitive && (
                            <View className="w-1.5 h-1.5 rounded-full bg-warning ml-1.5" />
                        )}
                    </View>
                </View>
            </View>
        </Pressable>
    );
}
