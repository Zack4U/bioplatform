"use client";

/**
 * CommunityLayout — 3-column Facebook-style layout.
 *
 * Desktop (lg+): Left sidebar (256px) | Center feed (flex-1) | Right sidebar (256px)
 * Tablet (md):   Left sidebar | Center feed (no right sidebar)
 * Mobile:        Center feed only + fixed bottom navigation bar
 *
 * @module components/features/community/CommunityLayout
 */

import { CommunityLeftSidebar } from "@/components/features/community/CommunityLeftSidebar";
import { CommunityRightSidebar } from "@/components/features/community/CommunityRightSidebar";
import { CommunityMobileNav } from "@/components/features/community/CommunityMobileNav";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface CommunityLayoutProps {
    children: React.ReactNode;
    hideRightSidebar?: boolean;
}

export function CommunityLayout({ children, hideRightSidebar }: CommunityLayoutProps) {
    const pathname = usePathname();
    const isMessageThread = pathname.startsWith("/community/messages/") && pathname !== "/community/messages";

    return (
        <>
            <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
                <div className={cn(
                    "mx-auto max-w-7xl",
                    isMessageThread
                        ? "px-0 py-0 pb-0 md:px-6 md:py-6 md:pb-6"
                        : "px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6"
                )}>
                    <div className="flex gap-6">
                        {/* Left sidebar — hidden on mobile, shown on md+ */}
                        <div className="hidden md:block w-64 shrink-0">
                            <Suspense fallback={null}>
                                <CommunityLeftSidebar />
                            </Suspense>
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

            {/* Mobile bottom navigation — only shown on mobile/tablet for authenticated users */}
            <Suspense fallback={null}>
                <CommunityMobileNav />
            </Suspense>
        </>
    );
}

