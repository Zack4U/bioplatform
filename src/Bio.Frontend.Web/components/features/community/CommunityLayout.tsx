"use client";

/**
 * CommunityLayout — 3-column Facebook-style layout.
 *
 * Desktop (lg+): Left sidebar (280px) | Center feed (flex-1) | Right sidebar (280px)
 * Tablet (md): Left sidebar | Center feed (no right sidebar)
 * Mobile: Center feed only, navigation via bottom tabs
 *
 * @module components/features/community/CommunityLayout
 */

import { CommunityLeftSidebar } from "@/components/features/community/CommunityLeftSidebar";
import { CommunityRightSidebar } from "@/components/features/community/CommunityRightSidebar";

interface CommunityLayoutProps {
    children: React.ReactNode;
    hideRightSidebar?: boolean;
}

export function CommunityLayout({ children, hideRightSidebar }: CommunityLayoutProps) {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* Left sidebar — hidden on mobile */}
                    <div className="hidden md:block w-64 shrink-0">
                        <CommunityLeftSidebar />
                    </div>

                    {/* Main content */}
                    <main
                        id="main-content"
                        className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0"
                        aria-label="Contenido principal de comunidad"
                    >
                        {children}
                    </main>

                    {/* Right sidebar — only on large screens */}
                    {!hideRightSidebar && (
                        <div className="hidden lg:block w-64 shrink-0">
                            <CommunityRightSidebar />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
