import { NAV_THEME } from "@/lib/theme";
import { ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import { Toaster } from "sonner-native";
import "../global.css";

// Silence Reanimated strict mode warnings (known issue with NativeWind theme toggles)
configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { colorScheme } = useColorScheme();
    const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);

    useEffect(() => {
        setIsColorSchemeLoaded(true);
        SplashScreen.hideAsync();
    }, []);

    if (!isColorSchemeLoaded) {
        return null;
    }

    return (
        <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
            <Stack>
                <Stack.Screen
                    name="index"
                    options={{ title: "BioCommerce Caldas" }}
                />
                <Stack.Screen
                    name="test"
                    options={{ title: "Componentes UI (Test)" }}
                />
            </Stack>
            <PortalHost />
            <Toaster />
        </ThemeProvider>
    );
}
