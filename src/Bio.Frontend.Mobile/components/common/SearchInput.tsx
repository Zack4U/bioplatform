/**
 * SearchInput — debounced search bar with clear button.
 * Built on RNR Input primitive.
 * Reused in species catalog, filters, etc.
 */

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";

interface SearchInputProps {
    placeholder?: string;
    value?: string;
    onChange: (value: string) => void;
    debounceMs?: number;
    className?: string;
}

export function SearchInput({
    placeholder = "Buscar especies...",
    value: controlledValue,
    onChange,
    debounceMs = 300,
    className,
}: SearchInputProps) {
    const { colorScheme } = useColorScheme();
    const [internalValue, setInternalValue] = useState(controlledValue ?? "");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync controlled value
    useEffect(() => {
        if (controlledValue !== undefined) {
            setInternalValue(controlledValue);
        }
    }, [controlledValue]);

    const handleChange = useCallback(
        (text: string) => {
            setInternalValue(text);

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => onChange(text), debounceMs);
        },
        [onChange, debounceMs],
    );

    const handleClear = useCallback(() => {
        setInternalValue("");
        onChange("");
    }, [onChange]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const mutedColor =
        colorScheme === "dark"
            ? "hsl(149, 10%, 65%)"
            : "hsl(149, 10%, 50%)";

    return (
        <View className={cn("relative", className)}>
            <View className="absolute left-3 top-0 bottom-0 z-10 justify-center">
                <Search size={16} color={mutedColor} />
            </View>
            <Input
                placeholder={placeholder}
                value={internalValue}
                onChangeText={handleChange}
                className="pl-10 pr-10"
                accessibilityLabel="Buscar"
                returnKeyType="search"
                autoCorrect={false}
            />
            {internalValue.length > 0 && (
                <Pressable
                    onPress={handleClear}
                    className="absolute right-2 top-0 bottom-0 z-10 justify-center px-1"
                    accessibilityLabel="Limpiar búsqueda"
                    accessibilityRole="button"
                >
                    <X size={16} color={mutedColor} />
                </Pressable>
            )}
        </View>
    );
}
