"use client";

/**
 * CommunityPostsManagement — admin table for community posts with status change, pin, delete.
 *
 * Follows the existing admin pattern: AdminDataTable + filter toolbar + detail dialog.
 *
 * @module components/features/admin/community-posts/CommunityPostsManagement
 */

import { StatusBadge } from "@/components/common";
import {
    AdminDataTable,
    type ColumnDef,
    type RowAction,
} from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { POST_CATEGORIES, POST_STATUS_LABELS } from "@/lib/constants";
import {
    useAdminPosts,
    useAdminDeletePost,
    useAdminTogglePin,
    useAdminChangePostStatus,
} from "@/hooks/features/admin/useAdminCommunity";
import type { CommunityPostListItem, PostStatus } from "@/types";
import { Eye, FileText, Pin, PinOff, Trash2, Archive, EyeOff } from "lucide-react";
import { useState } from "react";

type BadgeVariant = "success" | "warning" | "destructive" | "info" | "default" | "outline";

function getPostStatusVariant(status: string): BadgeVariant {
    switch (status) {
        case "Published":
            return "success";
        case "Draft":
            return "default";
        case "Archived":
            return "outline";
        case "Hidden":
            return "destructive";
        default:
            return "outline";
    }
}

const columns: ColumnDef<CommunityPostListItem>[] = [
    {
        key: "title",
        header: "Titulo",
        sortable: true,
        render: (p) => (
            <div className="max-w-[280px]">
                <span className="font-medium text-sm line-clamp-1">{p.title}</span>
                {p.isPinned && (
                    <Badge variant="outline" className="ml-1.5 text-[10px] py-0 px-1 text-primary border-primary/40">
                        <Pin className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                        Destacado
                    </Badge>
                )}
            </div>
        ),
    },
    {
        key: "authorName",
        header: "Autor",
        render: (p) => <span className="text-sm">{p.authorName}</span>,
    },
    {
        key: "category",
        header: "Categoria",
        hideOnMobile: true,
        render: (p) =>
            p.category ? (
                <Badge variant="secondary" className="text-xs">{p.category}</Badge>
            ) : (
                <span className="text-xs text-muted-foreground">—</span>
            ),
    },
    {
        key: "status",
        header: "Estado",
        render: (p) => (
            <StatusBadge
                label={POST_STATUS_LABELS[p.status as PostStatus] ?? p.status}
                variant={getPostStatusVariant(p.status)}
            />
        ),
    },
    {
        key: "commentCount",
        header: "Comentarios",
        hideOnMobile: true,
        sortable: true,
        render: (p) => <span className="text-sm tabular-nums">{p.commentCount}</span>,
    },
    {
        key: "likesCount",
        header: "Likes",
        hideOnMobile: true,
        sortable: true,
        render: (p) => <span className="text-sm tabular-nums">{p.likesCount}</span>,
    },
    {
        key: "createdAt",
        header: "Fecha",
        hideOnMobile: true,
        sortable: true,
        render: (p) => (
            <span className="text-xs text-muted-foreground">
                {new Date(p.createdAt).toLocaleDateString("es-CO")}
            </span>
        ),
    },
];

export function CommunityPostsManagement() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selected, setSelected] = useState<CommunityPostListItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const { posts, totalPages, isLoading } = useAdminPosts({
        category: categoryFilter && categoryFilter !== "all" ? categoryFilter : undefined,
        status: statusFilter && statusFilter !== "all" ? (statusFilter as PostStatus) : undefined,
        page,
        pageSize: 15,
    });

    const deletePost = useAdminDeletePost();
    const togglePin = useAdminTogglePin();
    const changeStatus = useAdminChangePostStatus();

    const handleChangeStatus = (id: string, status: "Draft" | "Published" | "Archived" | "Hidden") => {
        changeStatus.mutate({ id, status }, {
            onSuccess: () => {
                setSelected((prev) => prev?.id === id ? { ...prev, status } : prev);
            },
        });
    };

    const handleSort = (key: string) => {
        setSortBy((p) => {
            if (p === key) {
                setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
                return p;
            }
            setSortOrder("asc");
            return key;
        });
    };

    const actions: RowAction<CommunityPostListItem>[] = [
        {
            label: "Ver detalle",
            icon: <Eye className="h-4 w-4" />,
            onClick: (p) => {
                setSelected(p);
                setIsDetailOpen(true);
            },
        },
        {
            label: "Destacar / Quitar",
            icon: <Pin className="h-4 w-4" />,
            onClick: (p) => togglePin.mutate({ id: p.id, isPinned: p.isPinned }, {
                onSuccess: (post) => setSelected((prev) => prev?.id === p.id ? { ...prev, isPinned: post.isPinned } : prev),
            }),
        },
        {
            label: "Archivar",
            icon: <Archive className="h-4 w-4" />,
            onClick: (p) => handleChangeStatus(p.id, "Archived"),
        },
        {
            label: "Ocultar",
            icon: <EyeOff className="h-4 w-4" />,
            onClick: (p) => handleChangeStatus(p.id, "Hidden"),
        },
        {
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive" as const,
            onClick: (p) => deletePost.mutate(p.id),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Gestion de Posts
                </h1>
                <p className="text-muted-foreground">
                    Administra las publicaciones de la comunidad
                </p>
            </div>

            <AdminDataTable
                data={posts}
                columns={columns}
                actions={actions}
                keyExtractor={(p) => p.id}
                isLoading={isLoading}
                searchValue={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                searchPlaceholder="Buscar por titulo o autor..."
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                emptyTitle="No hay posts"
                emptyIcon={<FileText className="h-6 w-6" />}
                toolbar={
                    <div className="flex gap-2 flex-wrap">
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="Published">Publicado</SelectItem>
                                <SelectItem value="Draft">Borrador</SelectItem>
                                <SelectItem value="Archived">Archivado</SelectItem>
                                <SelectItem value="Hidden">Oculto</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {POST_CATEGORIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                }
            />

            {/* Post Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalle del Post</DialogTitle>
                        <DialogDescription>
                            Informacion completa de la publicacion
                        </DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-muted-foreground">Autor</p>
                                    <p className="font-medium">{selected.authorName}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Estado</p>
                                    <StatusBadge
                                        label={POST_STATUS_LABELS[selected.status as PostStatus] ?? selected.status}
                                        variant={getPostStatusVariant(selected.status)}
                                    />
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Categoria</p>
                                    <p className="font-medium">{selected.category ?? "Sin categoria"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Destacado</p>
                                    <p className="font-medium">
                                        {selected.isPinned ? "Si" : "No"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Comentarios</p>
                                    <p className="font-medium tabular-nums">{selected.commentCount}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Reacciones</p>
                                    <p className="font-medium tabular-nums">
                                        👍 {selected.likesCount} · 👎 {selected.dislikesCount}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-base mb-2">{selected.title}</h3>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        togglePin.mutate({ id: selected.id, isPinned: selected.isPinned })
                                    }
                                    disabled={togglePin.isPending}
                                >
                                    {selected.isPinned ? (
                                        <><PinOff className="h-3.5 w-3.5 mr-1" />Quitar pin</>
                                    ) : (
                                        <><Pin className="h-3.5 w-3.5 mr-1" />Destacar</>
                                    )}
                                </Button>
                                {selected.status !== "Published" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleChangeStatus(selected.id, "Published")}
                                        disabled={changeStatus.isPending}
                                    >
                                        <Eye className="h-3.5 w-3.5 mr-1" />Publicar
                                    </Button>
                                )}
                                {selected.status !== "Archived" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleChangeStatus(selected.id, "Archived")}
                                        disabled={changeStatus.isPending}
                                    >
                                        <Archive className="h-3.5 w-3.5 mr-1" />Archivar
                                    </Button>
                                )}
                                {selected.status !== "Hidden" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleChangeStatus(selected.id, "Hidden")}
                                        disabled={changeStatus.isPending}
                                    >
                                        <EyeOff className="h-3.5 w-3.5 mr-1" />Ocultar
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        deletePost.mutate(selected.id);
                                        setIsDetailOpen(false);
                                    }}
                                    disabled={deletePost.isPending}
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Eliminar
                                </Button>
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
