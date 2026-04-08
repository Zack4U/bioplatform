/**
 * Marketplace service — mock data layer for the Marketplace feature.
 *
 * Uses centralized mock data from `marketplace-mock.ts` to simulate
 * backend API responses. When backend endpoints are ready, swap mock
 * implementations with real Axios calls using CORE_ROUTES.PRODUCTS.
 *
 * @module services/marketplace-service
 */

import { MARKETPLACE_DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
    buildMockProductDetail,
    MOCK_CATEGORIES,
    MOCK_COUPONS,
    MOCK_PRODUCTS,
    MOCK_REVIEWS,
} from "@/lib/marketplace-mock";
import type {
    CouponCode,
    PaginatedResponse,
    ProductCategory,
    ProductDetailDTO,
    ProductListItem,
    ProductSearchParams,
    Review,
} from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simulate network latency (200-400ms) for realistic UX testing */
const delay = (ms = 300) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Products ────────────────────────────────────────────────────────────────

/**
 * Get paginated, filtered, and sorted product list.
 * Mock implementation — mirrors future GET /api/products response shape.
 */
export async function getProducts(
    params: ProductSearchParams = {},
): Promise<PaginatedResponse<ProductListItem>> {
    await delay();

    let items = [...MOCK_PRODUCTS];

    // Filter: search query
    if (params.query) {
        const q = params.query.toLowerCase();
        items = items.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.entrepreneurName.toLowerCase().includes(q) ||
                (p.baseSpeciesName?.toLowerCase().includes(q) ?? false) ||
                (p.categoryName?.toLowerCase().includes(q) ?? false),
        );
    }

    // Filter: category
    if (params.categoryId) {
        const cat = MOCK_CATEGORIES.find((c) => c.id === params.categoryId);
        if (cat) {
            items = items.filter((p) => p.categoryName === cat.name);
        }
    }

    // Filter: price range
    if (params.minPrice !== undefined) {
        items = items.filter((p) => p.price >= params.minPrice!);
    }
    if (params.maxPrice !== undefined) {
        items = items.filter((p) => p.price <= params.maxPrice!);
    }

    // Filter: rating
    if (params.minRating !== undefined) {
        items = items.filter((p) => (p.rating ?? 0) >= params.minRating!);
    }

    // Sort
    const sortBy = params.sortBy ?? "name";
    const sortOrder = params.sortOrder ?? "asc";
    const direction = sortOrder === "asc" ? 1 : -1;

    items.sort((a, b) => {
        switch (sortBy) {
            case "price":
                return (a.price - b.price) * direction;
            case "rating":
                return ((a.rating ?? 0) - (b.rating ?? 0)) * direction;
            case "createdAt":
                // Mock: use ID for ordering
                return a.id.localeCompare(b.id) * direction;
            case "name":
            default:
                return a.name.localeCompare(b.name, "es") * direction;
        }
    });

    // Paginate
    const pageSize = params.pageSize ?? MARKETPLACE_DEFAULT_PAGE_SIZE;
    const page = params.page ?? 1;
    const totalCount = items.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return {
        items: paged,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}

// ─── Product Detail ──────────────────────────────────────────────────────────

/**
 * Get full product detail by slug.
 * Mock: finds in MOCK_PRODUCTS and enriches via buildMockProductDetail.
 */
export async function getProductBySlug(
    slug: string,
): Promise<ProductDetailDTO | null> {
    await delay();

    const listItem = MOCK_PRODUCTS.find((p) => p.slug === slug);
    if (!listItem) return null;

    return buildMockProductDetail(listItem);
}

// ─── Categories ──────────────────────────────────────────────────────────────

/** Get all product categories. */
export async function getCategories(): Promise<ProductCategory[]> {
    await delay(150);
    return MOCK_CATEGORIES;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

/** Get reviews for a specific product. */
export async function getProductReviews(productId: string): Promise<Review[]> {
    await delay(150);
    const reviews = MOCK_REVIEWS.filter((r) => r.productId === productId);
    // Return at least some reviews for demo purposes
    if (reviews.length === 0) {
        return MOCK_REVIEWS.slice(0, 2).map((r, i) => ({
            ...r,
            id: `${r.id}-${productId}-${i}`,
            productId,
        }));
    }
    return reviews;
}

// ─── Coupon Validation ───────────────────────────────────────────────────────

/** Validate a coupon code. Returns the coupon if valid, null otherwise. */
export async function validateCoupon(code: string): Promise<CouponCode | null> {
    await delay(200);
    const coupon = MOCK_COUPONS[code.toUpperCase()];
    if (!coupon || !coupon.isValid) return null;
    return coupon;
}
