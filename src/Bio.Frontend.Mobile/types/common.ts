/**
 * Shared / common TypeScript types for BioCommerce Caldas
 */

/** Standard paginated API response */
export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

/** Standard API error response */
export interface ApiErrorResponse {
    status: number;
    title: string;
    detail: string;
    errors?: Record<string, string[]>;
    traceId?: string;
}

/** Standard API success wrapper */
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

/** Sort direction */
export type SortOrder = "asc" | "desc";

/** Base search params shared across features */
export interface BaseSearchParams {
    query?: string;
    page?: number;
    pageSize?: number;
    sortOrder?: SortOrder;
}

/** Select option for dropdowns */
export interface SelectOption<T = string> {
    label: string;
    value: T;
    disabled?: boolean;
}

/** Breadcrumb item */
export interface BreadcrumbItem {
    label: string;
    href?: string;
}

/** Navigation item */
export interface NavItem {
    label: string;
    href: string;
    icon?: string;
    badge?: string | number;
    children?: NavItem[];
    roles?: string[];
}
