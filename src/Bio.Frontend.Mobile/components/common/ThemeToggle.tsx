/**
 * ThemeToggle — dark/light mode toggle for mobile.
 * Built on RNR Switch primitive.
 * Uses NativeWind's useColorScheme hook.
 */

import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { View } from "react-native";

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export function ThemeToggle({
    className,
    showLabel = true,
}: ThemeToggleProps) {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";

    return (
        <View
            className={cn(
                "flex-row items-center justify-between gap-3",
                className,
            )}
        >
            <View className="flex-row items-center gap-2">
                {isDark ? (
                    <Moon size={18} className="text-foreground" color={isDark ? "hsl(149, 20%, 98%)" : "hsl(149, 10%, 15%)"} />
                ) : (
                    <Sun size={18} className="text-foreground" color={isDark ? "hsl(149, 20%, 98%)" : "hsl(149, 10%, 15%)"} />
                )}
                {showLabel && (
                    <Text className="text-sm">
                        {isDark ? "Modo oscuro" : "Modo claro"}
                    </Text>
                )}
            </View>
            <Switch
                checked={isDark}
                onCheckedChange={toggleColorScheme}
                accessibilityLabel={
                    isDark
                        ? "Cambiar a modo claro"
                        : "Cambiar a modo oscuro"
                }
            />
        </View>
    );
}
