/**
 * SpeciesListItem — Full-width card for list mode in the species catalog.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import type { SpeciesResponse } from "@/types";
import { Leaf, Shield } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Image, Pressable, View } from "react-native";

interface SpeciesListItemProps {
    item: SpeciesResponse;
    onPress?: () => void;
}

export function SpeciesListItem({ item, onPress }: SpeciesListItemProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    const family = item.taxonomy?.family;
    const kingdom = item.taxonomy?.kingdom;

    return (
        <Pressable className="active:opacity-80 mb-3" onPress={onPress}>
            <Card className="border-0 shadow-sm">
                <CardContent className="flex-row p-3 gap-3">
                    {/* Thumbnail */}
                    <View className="w-20 h-20 rounded-xl bg-muted items-center justify-center overflow-hidden">
                        {item.thumbnailUrl ? (
                            <Image
                                source={{ uri: item.thumbnailUrl }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : item.isSensitive ? (
                            <Shield
                                size={22}
                                color={theme.warning}
                                strokeWidth={1.5}
                            />
                        ) : (
                            <Leaf
                                size={22}
                                color={theme.mutedForeground}
                                strokeWidth={1.5}
                            />
                        )}
                    </View>

                    {/* Info */}
                    <View className="flex-1 justify-center">
                        <Text
                            className="font-semibold text-foreground text-sm"
                            numberOfLines={1}
                        >
                            {item.scientificName}
                        </Text>
                        {item.commonName && (
                            <Text
                                className="text-xs text-muted-foreground mt-0.5 italic"
                                numberOfLines={1}
                            >
                                {item.commonName}
                            </Text>
                        )}
                        <View className="flex-row items-center gap-2 mt-2">
                            <Badge
                                variant="secondary"
                                className="px-2 py-0.5"
                            >
                                <Text className="text-[10px]">
                                    {family ?? kingdom ?? "—"}
                                </Text>
                            </Badge>
                            {item.isSensitive && (
                                <Badge
                                    variant="outline"
                                    className="px-2 py-0.5 border-warning/40"
                                >
                                    <Text className="text-[10px] text-warning">
                                        Sensible
                                    </Text>
                                </Badge>
                            )}
                        </View>
                    </View>
                </CardContent>
            </Card>
        </Pressable>
    );
}
