/**
 * Admin Layout Zustand store — manages sidebar UI state.
 *
 * Controls sidebar collapse/expand on desktop and
 * open/close Sheet on mobile breakpoints.
 *
 * @module store/admin-layout-store
 */

import { create } from "zustand";

interface AdminLayoutState {
    /** Whether the sidebar is collapsed (icon-only mode) on desktop */
    isSidebarCollapsed: boolean;
    /** Whether the mobile sidebar Sheet is open */
    isMobileSidebarOpen: boolean;

    /** Toggle sidebar collapsed state (desktop) */
    toggleSidebar: () => void;
    /** Set sidebar collapsed state explicitly */
    setSidebarCollapsed: (collapsed: boolean) => void;
    /** Open mobile sidebar Sheet */
    openMobileSidebar: () => void;
    /** Close mobile sidebar Sheet */
    closeMobileSidebar: () => void;
}

export const useAdminLayoutStore = create<AdminLayoutState>((set) => ({
    isSidebarCollapsed: false,
    isMobileSidebarOpen: false,

    toggleSidebar: () =>
        set((state) => ({
            isSidebarCollapsed: !state.isSidebarCollapsed,
        })),

    setSidebarCollapsed: (collapsed) =>
        set({ isSidebarCollapsed: collapsed }),

    openMobileSidebar: () => set({ isMobileSidebarOpen: true }),

    closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
}));
