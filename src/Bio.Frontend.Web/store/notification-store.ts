/**
 * Notification Store — global unread counts for navbar badges.
 *
 * Keeps unread notification and message counts in sync across all pages.
 * Populated by useNotifications and useMessaging hooks via polling.
 *
 * Architecture: Zustand (Global Client State) — §2.2 copilot-instructions.md
 *
 * @module store/notification-store
 */

import { create } from "zustand";

interface NotificationState {
    /** Unread in-app notification count */
    unreadNotificationCount: number;
    /** Unread direct message count */
    unreadMessageCount: number;

    setUnreadNotificationCount: (count: number) => void;
    setUnreadMessageCount: (count: number) => void;
    /** Decrement notification count when user reads one */
    decrementNotificationCount: () => void;
    /** Reset all counts to 0 */
    resetCounts: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    unreadNotificationCount: 0,
    unreadMessageCount: 0,

    setUnreadNotificationCount: (count) =>
        set({ unreadNotificationCount: Math.max(0, count) }),

    setUnreadMessageCount: (count) =>
        set({ unreadMessageCount: Math.max(0, count) }),

    decrementNotificationCount: () =>
        set({
            unreadNotificationCount: Math.max(
                0,
                get().unreadNotificationCount - 1,
            ),
        }),

    resetCounts: () =>
        set({ unreadNotificationCount: 0, unreadMessageCount: 0 }),
}));
