"use client";

/**
 * CommunityLeftSidebar — left panel with user profile mini-card and quick navigation.
 * Only renders when user is authenticated.
 *
 * @module components/features/community/CommunityLeftSidebar
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/formatters";
import { useAuthStore } from "@/store/auth-store";
import {
    LayoutList,
    FileText,
    Users,
    MessageCircle,
    Users2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    /** If true, only exact pathname match activates this item */
    exact?: boolean;
    /** If set, this query param key+value must also match */
    searchParam?: { key: string; value: string };
}

const NAV_ITEMS: NavItem[] = [
    { label: "Feed", href: "/community", icon: LayoutList, exact: true },
    {
        label: "Mis Posts",
        href: "/community?tab=mine",
        icon: FileText,
        exact: true,
        searchParam: { key: "tab", value: "mine" },
    },
    { label: "Amigos", href: "/community/friends", icon: Users },
    { label: "Mensajes", href: "/community/messages", icon: MessageCircle },
    { label: "Grupos", href: "/community/groups", icon: Users2 },
];

export function CommunityLeftSidebar() {
    const { user, isAuthenticated } = useAuthStore();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Do not render the sidebar at all if user is not authenticated
    if (!isAuthenticated || !user) return null;

    function isItemActive(item: NavItem): boolean {
        // Exact pathname match required
        if (item.exact) {
            if (pathname !== "/community") return false;
            // Additional query param check (e.g. ?tab=mine)
            if (item.searchParam) {
                return searchParams.get(item.searchParam.key) === item.searchParam.value;
            }
            // Pure exact match (Feed) — must NOT have tab param
            return !searchParams.get("tab");
        }
        // Prefix match for sub-routes like /community/friends
        return pathname.startsWith(item.href);
    }

    return (
        <aside className="space-y-3 sticky top-20 self-start" aria-label="Navegacion de comunidad">
            {/* Profile mini-card */}
            <Card>
                <CardContent className="p-4">
                    <Link href="/profile" className="flex items-center gap-3 group">
                        <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getInitials(user.fullName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                {user.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                            </p>
                        </div>
                    </Link>
                </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
                <CardContent className="p-2">
                    <nav aria-label="Secciones de comunidad" className="flex flex-col gap-0.5">
                        {NAV_ITEMS.map((item) => {
                            const active = isItemActive(item);
                            const Icon = item.icon;
                            return (
                                <Button
                                    key={item.href}
                                    variant={active ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-3 font-medium",
                                        active && "text-primary",
                                    )}
                                    asChild
                                >
                                    <Link href={item.href} aria-current={active ? "page" : undefined}>
                                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                        {item.label}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>

                    <Separator className="my-2" />

                    <p className="text-xs text-muted-foreground px-2 py-1">
                        BioCommerce Caldas &copy; 2026
                    </p>
                </CardContent>
            </Card>
        </aside>
    );
}

