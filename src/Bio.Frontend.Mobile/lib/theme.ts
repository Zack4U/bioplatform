/**
 * React Navigation theme configuration for BioCommerce Caldas Mobile.
 *
 * IMPORTANT: These HSL values MUST match the CSS variables defined in global.css.
 * This file provides the same colors to React Navigation's ThemeProvider
 * (headers, tab bars, etc.) as NativeWind uses via global.css for all components.
 *
 * Source of truth: global.css (:root and .dark)
 */

import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";

export const THEME = {
    light: {
        background: "hsl(149 20% 98%)",
        foreground: "hsl(149 10% 15%)",
        card: "hsl(0 0% 100%)",
        cardForeground: "hsl(149 10% 15%)",
        popover: "hsl(0 0% 100%)",
        popoverForeground: "hsl(149 10% 15%)",
        primary: "hsl(149 70% 35%)",
        primaryForeground: "hsl(149 20% 98%)",
        secondary: "hsl(149 10% 95%)",
        secondaryForeground: "hsl(149 15% 25%)",
        muted: "hsl(149 10% 95%)",
        mutedForeground: "hsl(149 10% 50%)",
        accent: "hsl(149 50% 90%)",
        accentForeground: "hsl(149 60% 25%)",
        destructive: "hsl(0 84% 60%)",
        border: "hsl(149 10% 90%)",
        input: "hsl(149 10% 90%)",
        ring: "hsl(149 70% 35%)",
        radius: "10px",
        success: "hsl(149 60% 40%)",
        successForeground: "hsl(149 20% 98%)",
        warning: "hsl(45 90% 50%)",
        warningForeground: "hsl(45 80% 20%)",
        info: "hsl(210 80% 50%)",
        infoForeground: "hsl(149 20% 98%)",
        chart1: "hsl(149 70% 35%)",
        chart2: "hsl(210 80% 50%)",
        chart3: "hsl(45 90% 50%)",
        chart4: "hsl(30 80% 50%)",
        chart5: "hsl(280 70% 50%)",
    },
    dark: {
        background: "hsl(149 10% 12%)",
        foreground: "hsl(149 20% 98%)",
        card: "hsl(149 10% 15%)",
        cardForeground: "hsl(149 20% 98%)",
        popover: "hsl(149 10% 15%)",
        popoverForeground: "hsl(149 20% 98%)",
        primary: "hsl(149 50% 50%)",
        primaryForeground: "hsl(149 80% 15%)",
        secondary: "hsl(149 10% 25%)",
        secondaryForeground: "hsl(149 20% 98%)",
        muted: "hsl(149 10% 25%)",
        mutedForeground: "hsl(149 10% 65%)",
        accent: "hsl(149 40% 25%)",
        accentForeground: "hsl(149 60% 85%)",
        destructive: "hsl(0 60% 50%)",
        border: "hsl(149 10% 25%)",
        input: "hsl(149 10% 25%)",
        ring: "hsl(149 50% 50%)",
        radius: "10px",
        success: "hsl(149 50% 50%)",
        successForeground: "hsl(149 80% 15%)",
        warning: "hsl(45 90% 50%)",
        warningForeground: "hsl(45 80% 20%)",
        info: "hsl(210 80% 50%)",
        infoForeground: "hsl(210 80% 15%)",
        chart1: "hsl(149 50% 50%)",
        chart2: "hsl(210 80% 50%)",
        chart3: "hsl(45 90% 50%)",
        chart4: "hsl(280 70% 50%)",
        chart5: "hsl(15 70% 50%)",
    },
};

export const NAV_THEME: Record<"light" | "dark", Theme> = {
    light: {
        ...DefaultTheme,
        colors: {
            background: THEME.light.background,
            border: THEME.light.border,
            card: THEME.light.card,
            notification: THEME.light.destructive,
            primary: THEME.light.primary,
            text: THEME.light.foreground,
        },
    },
    dark: {
        ...DarkTheme,
        colors: {
            background: THEME.dark.background,
            border: THEME.dark.border,
            card: THEME.dark.card,
            notification: THEME.dark.destructive,
            primary: THEME.dark.primary,
            text: THEME.dark.foreground,
        },
    },
};
