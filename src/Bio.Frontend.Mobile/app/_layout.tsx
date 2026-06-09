/**
 * Root layout — BioCommerce Caldas Mobile.
 *
 * Configures theme, navigation stack, React Query provider,
 * sonner toasts, and portal host.
 *
 * Stack screens:
 * - splash: initial loading/sync screen
 * - (tabs): main app with bottom tabs
 * - login/register: auth flow
 * - test: component sandbox (dev only)
 */

import { useReconnectSync } from "@/hooks/useReconnectSync";
import { SPECIES_FILTER_META_QUERY_KEY } from "@/hooks/useSpecies";
import { NAV_THEME } from "@/lib/theme";
import * as speciesService from "@/services/species-service";
import { ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
    configureReanimatedLogger,
    ReanimatedLogLevel,
} from "react-native-reanimated";
import { Toaster } from "sonner-native";
import "../global.css";

// Silence Reanimated strict mode warnings (known issue with NativeWind theme toggles)
configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// React Query client instance — shared across the app
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            refetchOnWindowFocus: false,
            staleTime: 60 * 1000,
        },
    },
});

export default function RootLayout() {
    const { colorScheme } = useColorScheme();
    const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);

    // Flush the offline upload queue automatically when connectivity returns.
    useReconnectSync();

    useEffect(() => {
        setIsColorSchemeLoaded(true);
        SplashScreen.hideAsync();

        void queryClient.prefetchQuery({
            queryKey: SPECIES_FILTER_META_QUERY_KEY,
            queryFn: speciesService.getFilterMeta,
            staleTime: Infinity,
            gcTime: Infinity,
        });
    }, []);

    if (!isColorSchemeLoaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            animation: "fade",
                        }}
                    >
                        <Stack.Screen
                            name="splash"
                            options={{
                                headerShown: false,
                                animation: "fade",
                            }}
                        />
                        <Stack.Screen
                            name="(tabs)"
                            options={{
                                headerShown: false,
                                animation: "fade",
                            }}
                        />
                        <Stack.Screen
                            name="login"
                            options={{
                                title: "Iniciar Sesion",
                                headerShown: false,
                                animation: "slide_from_bottom",
                                presentation: "modal",
                            }}
                        />
                        <Stack.Screen
                            name="register"
                            options={{
                                title: "Crear Cuenta",
                                headerShown: false,
                                animation: "slide_from_right",
                            }}
                        />
                        <Stack.Screen
                            name="species/[id]"
                            options={{
                                title: "Detalle de Especie",
                                headerShown: false,
                                animation: "slide_from_right",
                            }}
                        />
                        {/* <Stack.Screen
                            name="model-info"
                            options={{
                                title: "Auditor del Modelo",
                                headerShown: false,
                                animation: "slide_from_right",
                            }}
                        /> */}
                        <Stack.Screen
                            name="model-stats"
                            options={{
                                title: "Estadísticas del Modelo",
                                headerShown: false,
                                animation: "slide_from_right",
                            }}
                        />
                        <Stack.Screen
                            name="test"
                            options={{
                                title: "Componentes UI (Test)",
                                headerShown: true,
                            }}
                        />
                    </Stack>
                    <PortalHost />
                    <Toaster />
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
