"use client";

/**
 * CommunityMobileNav — fixed bottom navigation bar for mobile/tablet.
 *
 * Only renders on screens smaller than `md`.
 * Only renders when the user is authenticated (non-auth users only see Feed).
 *
 * @module components/features/community/CommunityMobileNav
 */

import { useNotificationStore } from "@/store/notification-store";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import { LayoutList, Users, MessageCircle, Bell, Users2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileNavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: number;
}

export function CommunityMobileNav() {
    const { isAuthenticated } = useAuthStore();
    const unreadMessages = useNotificationStore((s) => s.unreadMessageCount);
    const unreadNotifications = useNotificationStore((s) => s.unreadNotificationCount);
    const pathname = usePathname();

    // Only show for authenticated users on mobile/tablet
    if (!isAuthenticated) return null;

    const items: MobileNavItem[] = [
        { label: "Feed", href: "/community", icon: LayoutList },
        { label: "Amigos", href: "/community/friends", icon: Users },
        { label: "Mensajes", href: "/community/messages", icon: MessageCircle, badge: unreadMessages },
        { label: "Grupos", href: "/community/groups", icon: Users2 },
        { label: "Alertas", href: "/notifications", icon: Bell, badge: unreadNotifications },
    ];

    function isActive(href: string): boolean {
        if (href === "/community") return pathname === "/community";
        return pathname.startsWith(href);
    }

    return (
        <nav
            className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
            aria-label="Navegacion mobile de comunidad"
        >
            <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
                {items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[3rem]",
                                active
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                            aria-current={active ? "page" : undefined}
                            aria-label={item.label}
                        >
                            <div className="relative">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                                {!!item.badge && item.badge > 0 && (
                                    <span
                                        className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground"
                                        aria-label={`${item.badge} sin leer`}
                                    >
                                        {item.badge > 99 ? "99+" : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium leading-none">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
