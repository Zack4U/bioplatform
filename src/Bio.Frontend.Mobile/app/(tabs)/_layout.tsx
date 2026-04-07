/**
 * Tab layout — BioCommerce Caldas Mobile.
 *
 * 5 tabs: Home, Catalog, Camera (CNN), Assistant (RAG), Profile
 * Uses @react-navigation/bottom-tabs via Expo Router.
 * Camera tab has a prominent elevated style as the primary action.
 */

import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import { View } from "react-native";
import {
    Home,
    BookOpen,
    Camera,
    Bot,
    User,
} from "lucide-react-native";
import { THEME } from "@/lib/theme";

export default function TabLayout() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.mutedForeground,
                tabBarStyle: {
                    backgroundColor: theme.card,
                    borderTopColor: theme.border,
                    borderTopWidth: 0.5,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 8,
                    elevation: 20,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 0.2,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Inicio",
                    tabBarIcon: ({ color, size }) => (
                        <Home size={size} color={color} strokeWidth={1.8} />
                    ),
                }}
            />
            <Tabs.Screen
                name="catalog"
                options={{
                    title: "Catálogo",
                    tabBarIcon: ({ color, size }) => (
                        <BookOpen size={size} color={color} strokeWidth={1.8} />
                    ),
                }}
            />
            <Tabs.Screen
                name="camera"
                options={{
                    title: "Identificar",
                    tabBarIcon: ({ focused }) => (
                        <View
                            className={`-mt-6 w-14 h-14 rounded-2xl items-center justify-center ${
                                focused
                                    ? "bg-primary shadow-lg"
                                    : "bg-primary/80"
                            }`}
                            style={{
                                elevation: focused ? 12 : 4,
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: focused ? 0.4 : 0.2,
                                shadowRadius: 8,
                            }}
                        >
                            <Camera
                                size={26}
                                color={theme.primaryForeground}
                                strokeWidth={2}
                            />
                        </View>
                    ),
                    tabBarLabel: () => null,
                }}
            />
            <Tabs.Screen
                name="assistant"
                options={{
                    title: "Asistente",
                    tabBarIcon: ({ color, size }) => (
                        <Bot size={size} color={color} strokeWidth={1.8} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ color, size }) => (
                        <User size={size} color={color} strokeWidth={1.8} />
                    ),
                }}
            />
        </Tabs>
    );
}
