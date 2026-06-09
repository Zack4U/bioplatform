/**
 * Admin sidebar navigation configuration.
 *
 * Driven by constants — no magic strings.
 * Each section's visibility is filtered by the user's roles at render time.
 *
 * @module lib/admin-sidebar-config
 */

import type { AdminNavSection } from "@/types";

/**
 * Complete sidebar navigation configuration.
 * Roles array on each item controls who can see it.
 * ADMIN sees everything.
 */
export const ADMIN_SIDEBAR_SECTIONS: AdminNavSection[] = [
    {
        titleKey: "General",
        items: [
            {
                key: "dashboard",
                labelKey: "Dashboard",
                href: "/admin",
                iconName: "LayoutDashboard",
                roles: ["ADMIN", "RESEARCHER", "ENTREPRENEUR", "AUTHORITY"],
            },
        ],
    },
    {
        titleKey: "Biodiversidad",
        items: [
            {
                key: "species",
                labelKey: "Especies",
                href: "/admin/species",
                iconName: "Leaf",
                roles: ["ADMIN", "RESEARCHER"],
            },
            {
                key: "images",
                labelKey: "Imagenes",
                href: "/admin/images",
                iconName: "Image",
                roles: ["ADMIN", "RESEARCHER"],
            },
        ],
    },
    {
        titleKey: "Marketplace",
        items: [
            {
                key: "products",
                labelKey: "Productos",
                href: "/admin/products",
                iconName: "Package",
                roles: ["ADMIN", "ENTREPRENEUR"],
            },
            {
                key: "orders",
                labelKey: "Ordenes",
                href: "/admin/orders",
                iconName: "ShoppingCart",
                roles: ["ADMIN", "ENTREPRENEUR"],
            },
            {
                key: "reviews",
                labelKey: "Resenas",
                href: "/admin/reviews",
                iconName: "Star",
                roles: ["ADMIN", "ENTREPRENEUR"],
            },
        ],
    },
    {
        titleKey: "Legal y Permisos",
        items: [
            {
                key: "permits",
                labelKey: "Permisos ABS",
                href: "/admin/permits",
                iconName: "Shield",
                roles: ["ADMIN", "AUTHORITY", "ENTREPRENEUR"],
            },
            {
                key: "requests",
                labelKey: "Solicitudes",
                href: "/admin/requests",
                iconName: "FileText",
                roles: ["ADMIN", "AUTHORITY", "RESEARCHER", "ENTREPRENEUR"],
            },
        ],
    },
    {
        titleKey: "Inteligencia Artificial",
        items: [
            {
                key: "ai-model",
                labelKey: "Modelo CNN",
                href: "/admin/ai-model",
                iconName: "Brain",
                roles: ["ADMIN", "RESEARCHER"],
            },
            {
                key: "chatbot",
                labelKey: "Chatbot RAG",
                href: "/admin/chatbot",
                iconName: "MessageSquare",
                roles: ["ADMIN", "RESEARCHER"],
            },
        ],
    },
    {
        titleKey: "Sistema",
        items: [
            {
                key: "users",
                labelKey: "Usuarios",
                href: "/admin/users",
                iconName: "Users",
                roles: ["ADMIN"],
            },
            {
                key: "audit-log",
                labelKey: "Registro de Auditoria",
                href: "/admin/audit-log",
                iconName: "ClipboardList",
                roles: ["ADMIN"],
            },
        ],
    },
    {
        titleKey: "Comunidad",
        items: [
            {
                key: "community-posts",
                labelKey: "Posts",
                href: "/admin/community-posts",
                iconName: "MessageSquare",
                roles: ["ADMIN", "COMMUNITY", "RESEARCHER", "ENTREPRENEUR", "AUTHORITY", "BUYER"],
            },
            {
                key: "community-comments",
                labelKey: "Comentarios",
                href: "/admin/community-comments",
                iconName: "MessageCircle",
                roles: ["ADMIN", "COMMUNITY", "RESEARCHER", "ENTREPRENEUR", "AUTHORITY", "BUYER"],
            },
        ],
    },
    {
        titleKey: "Networking",
        items: [
            {
                key: "connections",
                labelKey: "Conexiones",
                href: "/admin/connections",
                iconName: "UserPlus",
                roles: ["ADMIN"],
            },
        ],
    },
];

/**
 * Filter sidebar sections based on user roles.
 * Returns only sections that have at least one visible item for the given roles.
 */
export function getFilteredSidebarSections(
    userRoles: string[],
): AdminNavSection[] {
    return ADMIN_SIDEBAR_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) =>
            item.roles.some((role) => userRoles.includes(role)),
        ),
    })).filter((section) => section.items.length > 0);
}

/**
 * Map of route href → allowed roles.
 * Used by PageRoleGuard to enforce per-page role checks.
 * Single source of truth — matches ADMIN_SIDEBAR_SECTIONS roles.
 */
export const ROUTE_REQUIRED_ROLES: Record<string, import("@/types").UserRoleName[]> = {
    "/admin": ["ADMIN", "RESEARCHER", "ENTREPRENEUR", "AUTHORITY", "COMMUNITY"],
    "/admin/species": ["ADMIN", "RESEARCHER"],
    "/admin/images": ["ADMIN", "RESEARCHER"],
    "/admin/products": ["ADMIN", "ENTREPRENEUR"],
    "/admin/orders": ["ADMIN", "ENTREPRENEUR"],
    "/admin/reviews": ["ADMIN", "ENTREPRENEUR"],
    "/admin/permits": ["ADMIN", "AUTHORITY", "ENTREPRENEUR"],
    "/admin/requests": ["ADMIN", "AUTHORITY", "RESEARCHER", "ENTREPRENEUR"],
    "/admin/ai-model": ["ADMIN", "RESEARCHER"],
    "/admin/chatbot": ["ADMIN", "RESEARCHER"],
    "/admin/users": ["ADMIN"],
    "/admin/audit-log": ["ADMIN"],
    "/admin/community-posts": ["ADMIN", "COMMUNITY", "RESEARCHER", "ENTREPRENEUR", "AUTHORITY", "BUYER"],
    "/admin/community-comments": ["ADMIN", "COMMUNITY", "RESEARCHER", "ENTREPRENEUR", "AUTHORITY", "BUYER"],
    "/admin/connections": ["ADMIN"],
};
