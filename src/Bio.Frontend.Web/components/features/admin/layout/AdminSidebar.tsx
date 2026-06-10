"use client";

/**
 * AdminSidebar — collapsible sidebar for admin panel.
 * Uses Sheet on mobile, collapsible panel on desktop.
 * Filters sections based on user roles.
 *
 * @module components/features/admin/layout/AdminSidebar
 */

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getFilteredSidebarSections } from "@/lib/admin-sidebar-config";
import { cn } from "@/lib/utils";
import { useAdminLayoutStore } from "@/store/admin-layout-store";
import { useAuthStore } from "@/store/auth-store";
import {
    BadgeCheck, Brain, ChevronLeft, ChevronRight, ClipboardList, FileText, House, Image as ImageIcon, Leaf,
    LayoutDashboard, MessageCircle, MessageSquare, Package, Shield, ShoppingCart,
    Star, UserPlus, Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const ICON_MAP: Record<string, ReactNode> = {
    LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
    Leaf: <Leaf className="h-5 w-5" />,
    Image: <ImageIcon className="h-5 w-5" />,
    Package: <Package className="h-5 w-5" />,
    ShoppingCart: <ShoppingCart className="h-5 w-5" />,
    Star: <Star className="h-5 w-5" />,
    Shield: <Shield className="h-5 w-5" />,
    FileText: <FileText className="h-5 w-5" />,
    Brain: <Brain className="h-5 w-5" />,
    MessageSquare: <MessageSquare className="h-5 w-5" />,
    MessageCircle: <MessageCircle className="h-5 w-5" />,
    Users: <Users className="h-5 w-5" />,
    UserPlus: <UserPlus className="h-5 w-5" />,
    ClipboardList: <ClipboardList className="h-5 w-5" />,
    BadgeCheck: <BadgeCheck className="h-5 w-5" />,
};

function SidebarContent({ collapsed }: { collapsed: boolean }) {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const userRoles = user?.roles ?? [];
    const sections = getFilteredSidebarSections(userRoles);

    return (
        <div className="flex h-full flex-col">
            {/* Logo area */}
            <div className={cn(
                "flex h-14 items-center border-b px-4",
                collapsed ? "justify-center" : "gap-2",
            )}>
                <Leaf className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                {!collapsed && (
                    <span className="text-sm font-bold tracking-tight truncate">
                        BioCommerce Admin
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav
                className="flex-1 overflow-y-auto px-2 py-3"
                aria-label="Navegacion del panel de administracion"
            >
                {sections.map((section, sIdx) => (
                    <div key={section.titleKey}>
                        {sIdx > 0 && <Separator className="my-2" />}
                        {!collapsed && (
                            <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {section.titleKey}
                            </p>
                        )}
                        <ul className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive =
                                    item.href === "/admin"
                                        ? pathname === "/admin"
                                        : pathname.startsWith(item.href);
                                const icon = ICON_MAP[item.iconName] ?? null;

                                const linkContent = (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                            collapsed && "justify-center px-0",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                        )}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        <span className="shrink-0">{icon}</span>
                                        {!collapsed && (
                                            <span className="truncate">{item.labelKey}</span>
                                        )}
                                        {!collapsed && item.badge != null && item.badge > 0 && (
                                            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );

                                return (
                                    <li key={item.key}>
                                        {collapsed ? (
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    {linkContent}
                                                </TooltipTrigger>
                                                <TooltipContent side="right" sideOffset={8}>
                                                    {item.labelKey}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            linkContent
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* User info footer */}
            {!collapsed && user && (
                <div className="border-t px-4 py-3">
                    <p className="truncate text-sm font-medium">{user.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
            )}

            {/* Back to storefront */}
            <div className={cn(
                "border-t px-2 py-2",
                collapsed && "flex justify-center",
            )}>
                {collapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Link
                                href="/"
                                className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                aria-label="Ir al comercio"
                            >
                                <House className="h-5 w-5" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                            Ir al comercio
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground w-full"
                    >
                        <House className="h-5 w-5 shrink-0" />
                        <span className="truncate">Ir al comercio</span>
                    </Link>
                )}
            </div>
        </div>
    );
}

export function AdminSidebar() {
    const { isSidebarCollapsed, toggleSidebar, isMobileSidebarOpen, closeMobileSidebar } =
        useAdminLayoutStore();

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
                    isSidebarCollapsed ? "w-16" : "w-64",
                )}
            >
                <SidebarContent collapsed={isSidebarCollapsed} />
                <div className="border-t p-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        aria-label={isSidebarCollapsed ? "Expandir menu" : "Contraer menu"}
                        className="w-full"
                    >
                        {isSidebarCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </aside>

            {/* Mobile sidebar (Sheet) */}
            <Sheet open={isMobileSidebarOpen} onOpenChange={closeMobileSidebar}>
                <SheetContent side="left" className="w-64 p-0">
                    <SidebarContent collapsed={false} />
                </SheetContent>
            </Sheet>
        </>
    );
}
