/**
 * Secure storage wrapper — keeps JWT tokens in the device keystore/keychain.
 *
 * Backed by expo-secure-store (Android Keystore / iOS Keychain) instead of
 * AsyncStorage, which writes plaintext to disk. Provides an AsyncStorage-like
 * API (getItem/setItem/removeItem/multiRemove) so existing call sites only
 * swap the import.
 *
 * Resilience:
 * - Reads fall back to legacy AsyncStorage values and migrate them into
 *   SecureStore on first access (one-time transparent migration).
 * - Writes fall back to AsyncStorage if SecureStore is unavailable (e.g. web)
 *   or rejects the value (Android has a ~2KB per-value limit).
 *
 * @module lib/secure-storage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/** Read a value, preferring SecureStore and migrating legacy AsyncStorage data. */
async function getItem(key: string): Promise<string | null> {
    try {
        const value = await SecureStore.getItemAsync(key);
        if (value != null) return value;
    } catch {
        // SecureStore unavailable (e.g. web) — fall through to AsyncStorage.
    }

    // Legacy / fallback path: read from AsyncStorage and migrate if present.
    try {
        const legacy = await AsyncStorage.getItem(key);
        if (legacy != null) {
            try {
                await SecureStore.setItemAsync(key, legacy);
                await AsyncStorage.removeItem(key);
            } catch {
                // Migration best-effort only — keep returning the value.
            }
            return legacy;
        }
    } catch {
        // Ignore — nothing stored.
    }

    return null;
}

/** Persist a value in SecureStore, falling back to AsyncStorage on failure. */
async function setItem(key: string, value: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(key, value);
        // Drop any stale AsyncStorage copy left over from migration.
        try {
            await AsyncStorage.removeItem(key);
        } catch {
            // Non-fatal.
        }
    } catch {
        // SecureStore rejected (unavailable or value too large) — degrade gracefully.
        await AsyncStorage.setItem(key, value);
    }
}

/** Remove a value from both stores. */
async function removeItem(key: string): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(key);
    } catch {
        // Non-fatal.
    }
    try {
        await AsyncStorage.removeItem(key);
    } catch {
        // Non-fatal.
    }
}

/** Remove several values at once. */
async function multiRemove(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => removeItem(key)));
}

export const secureStorage = {
    getItem,
    setItem,
    removeItem,
    multiRemove,
};
