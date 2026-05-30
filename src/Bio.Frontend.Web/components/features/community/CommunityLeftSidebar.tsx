"use client";

/**
 * CommunityLeftSidebar — left panel with user profile mini-card and quick navigation.
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
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Feed", href: "/community", icon: LayoutList, exact: true },
    { label: "Mis Posts", href: "/community?tab=mine", icon: FileText, exact: false },
    { label: "Amigos", href: "/community/friends", icon: Users, exact: false },
    { label: "Mensajes", href: "/community/messages", icon: MessageCircle, exact: false },
    { label: "Grupos", href: "/community/groups", icon: Users2, exact: false },
];

export function CommunityLeftSidebar() {
    const { user, isAuthenticated } = useAuthStore();
    const pathname = usePathname();

    return (
        <aside className="space-y-3 sticky top-20 self-start" aria-label="Navegacion de comunidad">
            {/* Profile mini-card */}
            {isAuthenticated && user && (
                <Card>
                    <CardContent className="p-4">
                        <Link
                            href="/profile"
                            className="flex items-center gap-3 group"
                        >
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
            )}

            {/* Navigation */}
            <Card>
                <CardContent className="p-2">
                    <nav aria-label="Secciones de comunidad" className="flex flex-col gap-0.5">
                        {NAV_ITEMS.map((item) => {
                            const isActive = item.exact
                                ? pathname === item.href
                                : pathname.startsWith(item.href.split("?")[0]) &&
                                  item.href !== "/community";
                            const Icon = item.icon;
                            return (
                                <Button
                                    key={item.href}
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-3 font-medium",
                                        isActive && "text-primary",
                                    )}
                                    asChild
                                >
                                    <Link href={item.href}>
                                        <Icon
                                            className="h-4 w-4 shrink-0"
                                            aria-hidden="true"
                                        />
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
