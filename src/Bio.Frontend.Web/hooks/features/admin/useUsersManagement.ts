"use client";

import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { getAdminUsers, activateUser, deactivateUser } from "@/services/admin-service";
import type { UserAdminItem } from "@/types";
import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/lib/notifications";

export function useUsersManagement() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("fullName");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [selectedUser, setSelectedUser] = useState<UserAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "users", { search, roleFilter, statusFilter, page, pageSize: ADMIN_PAGE_SIZE }],
        queryFn: () =>
            getAdminUsers({
                search: search || undefined,
                roleName: roleFilter && roleFilter !== "all" ? roleFilter : undefined,
                isActive:
                    statusFilter === "active" ? true
                    : statusFilter === "inactive" ? false
                    : undefined,
                page,
                pageSize: ADMIN_PAGE_SIZE,
            }),
        staleTime: 30_000,
    });

    const activateMutation = useMutation({
        mutationFn: (id: string) => activateUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            notificationService.success("Usuario activado.");
        },
        onError: () => notificationService.error("No se pudo activar el usuario."),
    });

    const deactivateMutation = useMutation({
        mutationFn: (id: string) => deactivateUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            notificationService.success("Usuario desactivado.");
        },
        onError: () => notificationService.error("No se pudo desactivar el usuario."),
    });

    const users = data?.items ?? [];
    const totalPages = data?.totalPages ?? 1;

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
        const user = data?.items.find((u) => u.id === userId);
        if (!user) return;
        if (user.isActive) {
            deactivateMutation.mutate(userId);
        } else {
            activateMutation.mutate(userId);
        }
    }, [data, activateMutation, deactivateMutation]);

    return {
        isLoading,
        users,
        totalPages,
        page,
        setPage: (p: number) => { setPage(p); },
        search,
        setSearch: (v: string) => { setSearch(v); setPage(1); },
        roleFilter,
        setRoleFilter: (v: string) => { setRoleFilter(v); setPage(1); },
        statusFilter,
        setStatusFilter: (v: string) => { setStatusFilter(v); setPage(1); },
        sortBy,
        sortOrder,
        handleSort,
        selectedUser,
        isDetailOpen,
        setIsDetailOpen,
        openDetail,
        toggleActive,
    };
}
