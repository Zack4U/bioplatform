/**
 * Profile Screen — User settings and account management.
 *
 * Composes subcomponents:
 * - UserCard: avatar + account info (shows guest state if unauthenticated)
 * - SettingsList: preferences (theme, notifications, offline, sync) + information
 *
 * Settings are ALWAYS visible regardless of auth state.
 * Only the Logout button is shown when authenticated.
 */

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { SettingsList } from "@/components/profile/SettingsList";
import { UserCard } from "@/components/profile/UserCard";
import { useAuth } from "@/hooks/useAuth";
import { THEME } from "@/lib/theme";
import { LogOut } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { ScrollView, View } from "react-native";

export default function ProfileScreen() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            {/* User Card — shows guest state if not authenticated */}
            <UserCard user={user ?? null} isAuthenticated={isAuthenticated} />

            {/* Settings — always visible */}
            <SettingsList />

            {/* Logout — only when authenticated */}
            {isAuthenticated && (
                <View className="px-5">
                    <Button
                        variant="outline"
                        className="rounded-2xl h-14 border-destructive/30"
                        onPress={logout}
                    >
                        <LogOut
                            size={18}
                            color={theme.destructive}
                            strokeWidth={1.8}
                        />
                        <Text className="font-semibold text-destructive ml-2">
                            Cerrar Sesión
                        </Text>
                    </Button>
                </View>
            )}
        </ScrollView>
    );
}
