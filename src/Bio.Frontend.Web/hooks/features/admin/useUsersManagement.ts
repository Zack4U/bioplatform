"use client";

/**
 * useUsersManagement — state & data logic for users admin page.
 * TODO: Replace mock data with React Query API calls.
 */

import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { mockUsers } from "@/lib/admin-mock";
import type { UserAdminItem } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useUsersManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<UserAdminItem[]>([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("fullName");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [selectedUser, setSelectedUser] = useState<UserAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setUsers(mockUsers());
            setIsLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, []);

    const filtered = useMemo(() => {
        let result = [...users];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
            );
        }
        if (roleFilter) result = result.filter((u) => u.roles.includes(roleFilter as never));
        if (statusFilter === "active") result = result.filter((u) => u.isActive);
        if (statusFilter === "inactive") result = result.filter((u) => !u.isActive);

        result.sort((a, b) => {
            const aVal = (a as unknown as Record<string, unknown>)[sortBy] as string;
            const bVal = (b as unknown as Record<string, unknown>)[sortBy] as string;
            const cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""));
            return sortOrder === "asc" ? cmp : -cmp;
        });
        return result;
    }, [users, search, roleFilter, statusFilter, sortBy, sortOrder]);

    const totalPages = Math.ceil(filtered.length / ADMIN_PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);

    const handleSort = useCallback((key: string) => {
        setSortBy((prev) => {
            if (prev === key) { setSortOrder((o) => (o === "asc" ? "desc" : "asc")); return prev; }
            setSortOrder("asc");
            return key;
        });
    }, []);

    const openDetail = useCallback((user: UserAdminItem) => {
        setSelectedUser(user);
        setIsDetailOpen(true);
    }, []);

    const toggleActive = useCallback((userId: string) => {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    }, []);

    return {
        isLoading, users: paginated, totalPages, page, setPage,
        search, setSearch, roleFilter, setRoleFilter, statusFilter, setStatusFilter,
        sortBy, sortOrder, handleSort,
        selectedUser, isDetailOpen, setIsDetailOpen, openDetail, toggleActive,
    };
}
