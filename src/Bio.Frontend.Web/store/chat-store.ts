/**
 * Chat Store — manages floating chat popup windows state.
 *
 * Controls which threads are open/minimized as floating popups (desktop).
 * Max MAX_OPEN_CHATS visible simultaneously; extras are auto-minimized.
 *
 * Architecture: Zustand (Global Client State) — §2.2 copilot-instructions.md
 *
 * @module store/chat-store
 */

import { MAX_OPEN_CHATS } from "@/lib/constants";
import type { DirectThreadSummary } from "@/types";
import { create } from "zustand";

export interface ChatPopupEntry {
    thread: DirectThreadSummary;
    isMinimized: boolean;
}

interface ChatState {
    /** Currently active chat popup entries (open + minimized) */
    chats: ChatPopupEntry[];

    /** Open a chat window. Auto-minimizes oldest if MAX_OPEN_CHATS exceeded. */
    openChat: (thread: DirectThreadSummary) => void;

    /** Close and remove a chat popup completely */
    closeChat: (threadId: string) => void;

    /** Minimize a chat to a small bubble */
    minimizeChat: (threadId: string) => void;

    /** Restore a minimized chat to full popup */
    restoreChat: (threadId: string) => void;

    /** Update thread metadata (e.g., unread count, last message) */
    updateThread: (thread: DirectThreadSummary) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    chats: [],

    openChat: (thread) => {
        const { chats } = get();

        // If already open/minimized, just restore it
        const existing = chats.find((c) => c.thread.id === thread.id);
        if (existing) {
            set({
                chats: chats.map((c) =>
                    c.thread.id === thread.id ? { ...c, isMinimized: false } : c,
                ),
            });
            return;
        }

        const visibleCount = chats.filter((c) => !c.isMinimized).length;
        let updatedChats = [...chats];

        // Auto-minimize oldest visible chat if at capacity
        if (visibleCount >= MAX_OPEN_CHATS) {
            const oldestVisible = updatedChats.find((c) => !c.isMinimized);
            if (oldestVisible) {
                updatedChats = updatedChats.map((c) =>
                    c.thread.id === oldestVisible.thread.id
                        ? { ...c, isMinimized: true }
                        : c,
                );
            }
        }

        set({ chats: [...updatedChats, { thread, isMinimized: false }] });
    },

    closeChat: (threadId) => {
        set({ chats: get().chats.filter((c) => c.thread.id !== threadId) });
    },

    minimizeChat: (threadId) => {
        set({
            chats: get().chats.map((c) =>
                c.thread.id === threadId ? { ...c, isMinimized: true } : c,
            ),
        });
    },

    restoreChat: (threadId) => {
        const { chats } = get();
        const visibleCount = chats.filter((c) => !c.isMinimized).length;
        let updatedChats = [...chats];

        // Auto-minimize oldest if restoring would exceed max
        if (visibleCount >= MAX_OPEN_CHATS) {
            const oldestVisible = updatedChats.find((c) => !c.isMinimized);
            if (oldestVisible) {
                updatedChats = updatedChats.map((c) =>
                    c.thread.id === oldestVisible.thread.id
                        ? { ...c, isMinimized: true }
                        : c,
                );
            }
        }

        set({
            chats: updatedChats.map((c) =>
                c.thread.id === threadId ? { ...c, isMinimized: false } : c,
            ),
        });
    },

    updateThread: (thread) => {
        set({
            chats: get().chats.map((c) =>
                c.thread.id === thread.id ? { ...c, thread } : c,
            ),
        });
    },
}));
