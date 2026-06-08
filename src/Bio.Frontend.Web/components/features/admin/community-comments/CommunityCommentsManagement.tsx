"use client";

/**
 * CommunityCommentsManagement — admin table for community comments.
 *
 * @module components/features/admin/community-comments/CommunityCommentsManagement
 */

import {
    AdminDataTable,
    type ColumnDef,
    type RowAction,
} from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { deleteComment } from "@/services/community-service";
import { notificationService } from "@/lib/notifications";
import { useAdminPosts } from "@/hooks/features/admin/useAdminCommunity";
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, MessageCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommunityCommentResponse, PaginatedResponse } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getComments } from "@/services/community-service";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { useState } from "react";

const columns: ColumnDef<CommunityCommentResponse>[] = [
    {
        key: "authorName",
        header: "Autor",
        render: (c) => <span className="font-medium text-sm">{c.authorName}</span>,
    },
    {
        key: "content",
        header: "Contenido",
        render: (c) => (
            <p className="text-sm text-muted-foreground line-clamp-2 max-w-[300px]">
                {c.isDeleted ? (
                    <span className="italic">[Eliminado]</span>
                ) : (
                    c.content
                )}
            </p>
        ),
    },
    {
        key: "isDeleted",
        header: "Estado",
        render: (c) =>
            c.isDeleted ? (
                <Badge variant="destructive" className="text-xs">Eliminado</Badge>
            ) : (
                <Badge variant="secondary" className="text-xs">Activo</Badge>
            ),
    },
    {
        key: "likesCount",
        header: "Likes",
        hideOnMobile: true,
        sortable: true,
        render: (c) => <span className="text-sm tabular-nums">{c.likesCount}</span>,
    },
    {
        key: "createdAt",
        header: "Fecha",
        hideOnMobile: true,
        sortable: true,
        render: (c) => (
            <span className="text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString("es-CO")}
            </span>
        ),
    },
];

export function CommunityCommentsManagement() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedPostId, setSelectedPostId] = useState("");
    const [postSearch, setPostSearch] = useState("");
    const [postComboOpen, setPostComboOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Get post list for filter combobox (search all statuses)
    const { posts: postOptions } = useAdminPosts({
        pageSize: 100,
    });

    const filteredPostOptions = postOptions.filter((p) =>
        !postSearch || p.title.toLowerCase().includes(postSearch.toLowerCase())
    );
    const selectedPost = postOptions.find((p) => p.id === selectedPostId);

    // Get comments for selected post
    const { data: commentsData, isLoading: loadingComments } = useQuery<
        PaginatedResponse<CommunityCommentResponse>
    >({
        queryKey: ["admin", "community", "comments", selectedPostId, page],
        queryFn: () => getComments(selectedPostId, { page, pageSize: ADMIN_PAGE_SIZE }),
        enabled: !!selectedPostId,
        staleTime: 60 * 1000,
    });

    const comments = commentsData?.items ?? [];
    const totalPages = commentsData?.totalPages ?? 1;

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

    const actions: RowAction<CommunityCommentResponse>[] = [
        {
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive" as const,
            onClick: async (c) => {
                try {
                    await deleteComment(c.postId, c.id);
                    queryClient.invalidateQueries({
                        queryKey: ["admin", "community", "comments"],
                    });
                    notificationService.success("Comentario eliminado.");
                } catch {
                    notificationService.error("No se pudo eliminar el comentario.");
                }
            },
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Gestion de Comentarios
                </h1>
                <p className="text-muted-foreground">
                    Modera los comentarios de la comunidad
                </p>
            </div>

            <AdminDataTable
                data={comments}
                columns={columns}
                actions={actions}
                keyExtractor={(c) => c.id}
                isLoading={loadingComments && !!selectedPostId}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por contenido..."
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                emptyTitle={
                    selectedPostId
                        ? "Sin comentarios en este post"
                        : "Selecciona un post para ver sus comentarios"
                }
                emptyIcon={<MessageCircle className="h-6 w-6" />}
                toolbar={
                    <Popover open={postComboOpen} onOpenChange={setPostComboOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={postComboOpen}
                                className="w-[280px] justify-between font-normal"
                            >
                                <span className="truncate">
                                    {selectedPost ? selectedPost.title : "Selecciona un post..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Buscar por título..."
                                    value={postSearch}
                                    onValueChange={setPostSearch}
                                />
                                <CommandList>
                                    {filteredPostOptions.length === 0 && (
                                        <CommandEmpty>
                                            <MessageCircle className="h-4 w-4 mx-auto mb-1 opacity-50" />
                                            No se encontraron posts
                                        </CommandEmpty>
                                    )}
                                    <CommandGroup>
                                        {filteredPostOptions.map((p) => (
                                            <CommandItem
                                                key={p.id}
                                                value={p.id}
                                                onSelect={() => {
                                                    setSelectedPostId(p.id === selectedPostId ? "" : p.id);
                                                    setPage(1);
                                                    setPostComboOpen(false);
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", p.id === selectedPostId ? "opacity-100" : "opacity-0")} />
                                                <span className="line-clamp-1 text-sm">{p.title}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                }
            />
        </div>
    );
}
