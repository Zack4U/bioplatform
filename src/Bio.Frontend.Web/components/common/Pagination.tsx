"use client";

/**
 * Pagination — page navigation for paginated lists.
 * Built on Shadcn Button primitives.
 * WCAG: nav landmark, aria-label, aria-current for active page.
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = getPageNumbers(currentPage, totalPages);

    return (
        <nav
            aria-label="Paginación"
            className={cn("flex justify-center", className)}
        >
            <ul className="flex items-center gap-1">
                {/* Previous */}
                <li>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        aria-label="Página anterior"
                    >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </li>

                {/* Page numbers */}
                {pages.map((page, index) =>
                    page === "..." ? (
                        <li key={`ellipsis-${index}`}>
                            <span className="inline-flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">
                                …
                            </span>
                        </li>
                    ) : (
                        <li key={page}>
                            <Button
                                variant={
                                    currentPage === page ? "default" : "outline"
                                }
                                size="icon"
                                onClick={() => onPageChange(page as number)}
                                aria-label={`Página ${page}`}
                                aria-current={
                                    currentPage === page ? "page" : undefined
                                }
                            >
                                {page}
                            </Button>
                        </li>
                    ),
                )}

                {/* Next */}
                <li>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        aria-label="Página siguiente"
                    >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </li>
            </ul>
        </nav>
    );
}

/** Build page number array with ellipsis for large ranges */
function getPageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [1];

    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < total - 2) pages.push("...");

    pages.push(total);

    return pages;
}
