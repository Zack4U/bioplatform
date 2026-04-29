"use client";

/**
 * AdminDataTable — reusable data table for admin management pages.
 * Responsive: table on desktop, card list on mobile.
 *
 * @module components/features/admin/shared/AdminDataTable
 */

import { EmptyState, Pagination, SearchInput } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Search } from "lucide-react";
import { type ReactNode } from "react";

export interface ColumnDef<T> {
    key: string;
    header: string;
    sortable?: boolean;
    className?: string;
    hideOnMobile?: boolean;
    render: (item: T) => ReactNode;
}

export interface RowAction<T> {
    label: string;
    icon?: ReactNode;
    onClick: (item: T) => void;
    variant?: "default" | "destructive";
    hidden?: (item: T) => boolean;
}

interface AdminDataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    actions?: RowAction<T>[];
    keyExtractor: (item: T) => string;
    isLoading?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    onSort?: (key: string) => void;
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyIcon?: ReactNode;
    toolbar?: ReactNode;
    /** Mobile card renderer — if not provided, uses default card layout */
    mobileCardRender?: (item: T) => ReactNode;
}

export function AdminDataTable<T>({
    data, columns, actions, keyExtractor, isLoading = false,
    searchValue, onSearchChange, searchPlaceholder = "Buscar...",
    sortBy, sortOrder, onSort,
    currentPage = 1, totalPages = 1, onPageChange,
    emptyTitle = "Sin resultados", emptyDescription = "No se encontraron elementos.",
    emptyIcon, toolbar, mobileCardRender,
}: AdminDataTableProps<T>) {
    const getSortIcon = (key: string) => {
        if (sortBy !== key) return <ArrowUpDown className="h-3.5 w-3.5" />;
        return sortOrder === "asc"
            ? <ArrowUp className="h-3.5 w-3.5" />
            : <ArrowDown className="h-3.5 w-3.5" />;
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-24" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {onSearchChange && (
                    <SearchInput
                        value={searchValue}
                        onChange={onSearchChange}
                        placeholder={searchPlaceholder}
                        className="sm:max-w-xs"
                    />
                )}
                {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
            </div>

            {data.length === 0 ? (
                <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    icon={emptyIcon ?? <Search className="h-6 w-6" />}
                />
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden md:block rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {columns.map((col) => (
                                        <TableHead
                                            key={col.key}
                                            className={cn(col.className, col.hideOnMobile && "hidden lg:table-cell")}
                                        >
                                            {col.sortable && onSort ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="-ml-3 h-8 gap-1"
                                                    onClick={() => onSort(col.key)}
                                                >
                                                    {col.header}
                                                    {getSortIcon(col.key)}
                                                </Button>
                                            ) : (
                                                col.header
                                            )}
                                        </TableHead>
                                    ))}
                                    {actions && actions.length > 0 && (
                                        <TableHead className="w-12">Acciones</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item) => (
                                    <TableRow key={keyExtractor(item)}>
                                        {columns.map((col) => (
                                            <TableCell
                                                key={col.key}
                                                className={cn(col.className, col.hideOnMobile && "hidden lg:table-cell")}
                                            >
                                                {col.render(item)}
                                            </TableCell>
                                        ))}
                                        {actions && actions.length > 0 && (
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" aria-label="Acciones">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {actions
                                                            .filter((a) => !a.hidden?.(item))
                                                            .map((action) => (
                                                                <DropdownMenuItem
                                                                    key={action.label}
                                                                    onClick={() => action.onClick(item)}
                                                                    className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
                                                                >
                                                                    {action.icon && <span className="mr-2">{action.icon}</span>}
                                                                    {action.label}
                                                                </DropdownMenuItem>
                                                            ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile card list */}
                    <div className="grid grid-cols-1 gap-3 md:hidden">
                        {data.map((item) =>
                            mobileCardRender ? (
                                <div key={keyExtractor(item)}>{mobileCardRender(item)}</div>
                            ) : (
                                <Card key={keyExtractor(item)}>
                                    <CardContent className="flex items-center justify-between gap-3 p-4">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            {columns.slice(0, 3).map((col) => (
                                                <div key={col.key} className="text-sm">
                                                    {col.render(item)}
                                                </div>
                                            ))}
                                        </div>
                                        {actions && actions.length > 0 && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {actions
                                                        .filter((a) => !a.hidden?.(item))
                                                        .map((action) => (
                                                            <DropdownMenuItem
                                                                key={action.label}
                                                                onClick={() => action.onClick(item)}
                                                            >
                                                                {action.icon && <span className="mr-2">{action.icon}</span>}
                                                                {action.label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </CardContent>
                                </Card>
                            ),
                        )}
                    </div>
                </>
            )}

            {/* Pagination */}
            {totalPages > 1 && onPageChange && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                />
            )}
        </div>
    );
}
