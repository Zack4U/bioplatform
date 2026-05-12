/**
 * Centralized API route constants for the .NET Core backend.
 *
 * All route strings in one place — eliminates magic strings across services.
 * Base path: /api (prepended by Axios baseURL from constants.ts)
 *
 * @module services/routes/core-routes
 */

export const CORE_ROUTES = {
  /** AuthController — /api/auth */
  AUTH: {
    LOGIN: "/auth/login",
    REFRESH: "/auth/refresh",
    REVOKE: "/auth/revoke",
    CHANGE_PASSWORD: "/auth/change-password",
    TWO_FACTOR_SETUP: "/auth/2fa/setup",
    TWO_FACTOR_VERIFY: "/auth/2fa/verify",
    TWO_FACTOR_DISABLE: "/auth/2fa/disable",
    TWO_FACTOR_LOGIN_CONFIRM: "/auth/2fa/login-confirm",
  },

  /** UsersController — /api/users */
  USERS: {
    BASE: "/users",
    BY_ID: (id: string) => `/users/${id}` as const,
    BY_EMAIL: (email: string) => `/users/email/${email}` as const,
    BY_PHONE: (phone: string) => `/users/phone/${phone}` as const,
  },

  /** UserRolesController — /api/userroles */
  USER_ROLES: {
    BASE: "/userroles",
    BY_ID: (id: string) => `/userroles/${id}` as const,
  },

  /** SpeciesController — /api/species */
  SPECIES: {
    BASE: "/species",
    BY_ID: (id: string) => `/species/${id}` as const,
    BY_SLUG: (slug: string) => `/species/slug/${slug}` as const,
    DISTRIBUTIONS: (id: string) => `/species/${id}/distributions` as const,
    IMAGES: (id: string) => `/species/${id}/images` as const,
    OBSERVATIONS: (id: string) => `/species/${id}/observations` as const,
    FILTER_META: "/species/filter-meta",
  },

  /** TaxonomyController — /api/taxonomy */
  TAXONOMY: {
    BASE: "/taxonomy",
    BY_ID: (id: number) => `/taxonomy/${id}` as const,
  },

  /** ProductsController — /api/products */
  PRODUCTS: {
    BASE: "/products",
    BY_ID: (id: string) => `/products/${id}` as const,
    BY_SLUG: (slug: string) => `/products/slug/${slug}` as const,
    CATEGORIES: "/products/categories",
    FILTER_META: "/products/filter-meta",
    REVIEWS: (productId: string) => `/products/${productId}/reviews` as const,
    /** Paginated list of the authenticated entrepreneur's own products */
    MY_PRODUCTS: "/products/my",
    /** Gallery images for a specific product */
    IMAGES: (productId: string) => `/products/${productId}/images` as const,
    /** Related products by category/species (GET) */
    RELATED: (productId: string) => `/products/${productId}/related` as const,
  },

  /** OrdersController — /api/orders */
  ORDERS: {
    BASE: "/orders",
    BY_ID: (id: string) => `/orders/${id}` as const,
    MINE: "/orders/mine",
    VALIDATE_COUPON: "/orders/validate-coupon",
    /** Initiate a Stripe / PSE checkout session for an existing order */
    CHECKOUT_SESSION: (orderId: string) =>
      `/orders/${orderId}/checkout-session` as const,
  },

  /** AddressesController — /api/addresses */
  ADDRESSES: {
    BASE: "/addresses",
    BY_ID: (id: string) => `/addresses/${id}` as const,
    /** Returns (or sets) the user's default shipping address */
    DEFAULT: "/addresses/default",
  },

  /** AbsPermitsController — /api/abspermits (Nagoya Protocol compliance) */
  ABS_PERMITS: {
    BASE: "/abspermits",
    BY_ID: (id: string) => `/abspermits/${id}` as const,
  },

  /** CertificationsController — /api/certifications */
  CERTIFICATIONS: {
    BASE: "/certifications",
    BY_ID: (id: string) => `/certifications/${id}` as const,
  },

  /** TraceabilityController — /api/traceability */
  TRACEABILITY: {
    BASE: "/traceability",
    BY_PRODUCT: (productId: string) =>
      `/traceability/product/${productId}` as const,
  },

  /**
   * Manage — entrepreneur product management routes.
   * Distinct from the public /products routes.
   */
  MANAGE_PRODUCTS: {
    /** Multipart upload endpoint for product gallery images */
    UPLOAD_IMAGE: "/manage/products/images/upload",
    /** Soft-delete a single product image by its image ID */
    DELETE_IMAGE: (imageId: string) =>
      `/manage/products/images/${imageId}` as const,
    /** Promote a specific image to primary / cover */
    SET_IMAGE_PRIMARY: (imageId: string) =>
      `/manage/products/images/${imageId}/primary` as const,
  },

  /** FavoritesController — /api/favorites */
  FAVORITES: {
    BASE: "/favorites",
    /** Toggle favourite status for a product (POST) */
    TOGGLE: (productId: string) => `/favorites/${productId}/toggle` as const,
    /** Check whether a product is in the current user's favourites (GET) */
    CHECK: (productId: string) => `/favorites/${productId}/check` as const,
  },

  /** CartController — /api/v1/cart */
  CART: {
    BASE: "/v1/cart",
    ITEMS: "/v1/cart/items",
    ITEM: (itemId: string) => `/v1/cart/items/${itemId}` as const,
    ITEM_TOGGLE: (itemId: string) => `/v1/cart/items/${itemId}/toggle` as const,
    /** POST — sync guest cart with server cart after login */
    SYNC: "/v1/cart/sync",
    /** POST — validate prices of cart items (read-only, returns diffs) */
    VALIDATE_PRICES: "/v1/cart/validate-prices",
  },

  /** ReviewsController — /api/reviews */
  REVIEWS: {
    /** GET — paginated reviews written by the authenticated user (profile tab) */
    MY: "/reviews/my",
  },
} as const;
