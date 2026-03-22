/**
 * useThemeMode — Custom hook to manage theme mode (light, dark, system).
 *
 * Wraps NativeWind's useColorScheme with system-appearance detection
 * via React Native's Appearance API.
 *
 * Persists the user's choice via AsyncStorage.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import { Appearance } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "@biocommerce/theme-mode";

export function useThemeMode() {
    const { colorScheme, setColorScheme } = useNativeWindColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
    const [isLoaded, setIsLoaded] = useState(false);

    // Load persisted theme mode on mount
    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
            const mode = (stored as ThemeMode) ?? "system";
            setThemeModeState(mode);
            applyTheme(mode);
            setIsLoaded(true);
        });
    });

    // Listen for system appearance changes when in "system" mode
    useEffect(() => {
        if (themeMode !== "system") return;

        const subscription = Appearance.addChangeListener(
            ({ colorScheme: systemScheme }) => {
                setColorScheme(systemScheme ?? "light");
            },
        );

        return () => subscription.remove();
    }, [themeMode, setColorScheme]);

    const applyTheme = useCallback(
        (mode: ThemeMode) => {
            if (mode === "system") {
                const systemScheme = Appearance.getColorScheme() ?? "light";
                setColorScheme(systemScheme);
            } else {
                setColorScheme(mode);
            }
        },
        [setColorScheme],
    );

    const setThemeMode = useCallback(
        (mode: ThemeMode) => {
            setThemeModeState(mode);
            applyTheme(mode);
            AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        },
        [applyTheme],
    );

    return {
        /** Current resolved color scheme (always "light" or "dark") */
        colorScheme,
        /** User's theme preference ("light" | "dark" | "system") */
        themeMode,
        /** Set the theme mode */
        setThemeMode,
        /** Whether the persisted mode has been loaded */
        isLoaded,
    };
}
