"use client";

/**
 * UsersManagement — admin page for managing platform users.
 * Admin only.
 */

import { StatusBadge } from "@/components/common";
import {
    AdminDataTable, type ColumnDef, type RowAction,
} from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { USER_ROLES } from "@/lib/constants";
import { useUsersManagement } from "@/hooks/features/admin/useUsersManagement";
import type { UserAdminItem } from "@/types";
import { Eye, Power, Trash2, Users } from "lucide-react";

const columns: ColumnDef<UserAdminItem>[] = [
    {
        key: "fullName", header: "Nombre", sortable: true,
        render: (u) => <span className="font-medium">{u.fullName}</span>,
    },
    {
        key: "email", header: "Email", sortable: true, hideOnMobile: true,
        render: (u) => <span className="text-sm text-muted-foreground">{u.email}</span>,
    },
    {
        key: "roles", header: "Roles",
        render: (u) => (
            <div className="flex flex-wrap gap-1">
                {u.roles.map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                ))}
            </div>
        ),
    },
    {
        key: "isActive", header: "Estado",
        render: (u) => (
            <StatusBadge
                label={u.isActive ? "Activo" : "Inactivo"}
                variant={u.isActive ? "success" : "destructive"}
            />
        ),
    },
    {
        key: "lastLogin", header: "Ultimo Acceso", hideOnMobile: true,
        render: (u) => (
            <span className="text-sm text-muted-foreground">
                {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("es-CO") : "Nunca"}
            </span>
        ),
    },
];

export function UsersManagement() {
    const {
        isLoading, users, totalPages, page, setPage,
        search, setSearch, roleFilter, setRoleFilter, statusFilter, setStatusFilter,
        sortBy, sortOrder, handleSort,
        selectedUser, isDetailOpen, setIsDetailOpen, openDetail, toggleActive,
    } = useUsersManagement();

    const actions: RowAction<UserAdminItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: openDetail },
        {
            label: "Cambiar estado",
            icon: <Power className="h-4 w-4" />,
            onClick: (u) => toggleActive(u.id),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Gestion de Usuarios
                </h1>
                <p className="text-muted-foreground">
                    Administra los usuarios de la plataforma
                </p>
            </div>

            <AdminDataTable
                data={users}
                columns={columns}
                actions={actions}
                keyExtractor={(u) => u.id}
                isLoading={isLoading}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por nombre o email..."
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                emptyTitle="No hay usuarios"
                emptyIcon={<Users className="h-6 w-6" />}
                toolbar={
                    <div className="flex gap-2">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Todos los roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los roles</SelectItem>
                                {Object.entries(USER_ROLES).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Activos</SelectItem>
                                <SelectItem value="inactive">Inactivos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                }
            />

            {/* User Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalle de Usuario</DialogTitle>
                        <DialogDescription>
                            Informacion completa del usuario seleccionado
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Nombre</p>
                                    <p className="font-medium">{selectedUser.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Telefono</p>
                                    <p className="font-medium">{selectedUser.phoneNumber ?? "No registrado"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Estado</p>
                                    <StatusBadge
                                        label={selectedUser.isActive ? "Activo" : "Inactivo"}
                                        variant={selectedUser.isActive ? "success" : "destructive"}
                                    />
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Verificado</p>
                                    <p className="font-medium">{selectedUser.isVerified ? "Si" : "No"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">2FA</p>
                                    <p className="font-medium">{selectedUser.twoFactorEnabled ? "Habilitado" : "Deshabilitado"}</p>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Roles asignados</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedUser.roles.map((role) => (
                                        <Badge key={role} variant="outline">{role}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
