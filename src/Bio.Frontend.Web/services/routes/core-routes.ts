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

  /** UserRolesController — /api/user-roles */
  USER_ROLES: {
    BASE: "/user-roles",
    BY_ID: (id: string) => `/user-roles/${id}` as const,
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
    CATEGORIES: "/product-categories",
    FILTER_META: "/products/filter-meta",
    REVIEWS: (productId: string) => `/products/${productId}/reviews` as const,
    /** Paginated list of the authenticated user's managed products (admin sees all, entrepreneur sees own) */
    MY_PRODUCTS: "/manage/products",
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

  /** AbsPermitsController — /api/v1/abs-permits (Nagoya Protocol compliance) */
  ABS_PERMITS: {
    BASE: "/v1/abs-permits",
    BY_ID: (id: string) => `/v1/abs-permits/${id}` as const,
    BY_ENTREPRENEUR: (id: string) => `/v1/abs-permits/entrepreneur/${id}` as const,
  },

  /** CertificationsController — /api/v1/products/{productId}/certifications */
  CERTIFICATIONS: {
    BY_PRODUCT: (productId: string) =>
      `/v1/products/${productId}/certifications` as const,
    BY_ID: (certId: string) => `/v1/certifications/${certId}` as const,
  },

  /** TraceabilityController — /api/v1/products/{productId}/traceability */
  TRACEABILITY: {
    BY_PRODUCT: (productId: string) =>
      `/v1/products/${productId}/traceability` as const,
    BY_BATCH: (batchId: string) => `/v1/traceability/${batchId}` as const,
  },

  /**
   * Manage — entrepreneur product management routes.
   * Distinct from the public /products routes.
   */
  MANAGE_PRODUCTS: {
    /** Create / list entrepreneur-managed products (POST create, GET list) */
    BASE: "/manage/products",
    /** Update (PUT) or soft-delete (DELETE) a managed product by ID */
    BY_ID: (id: string) => `/manage/products/${id}` as const,
    /** Approve a pending product (Admin / Authority) */
    APPROVE: (id: string) => `/manage/products/${id}/approve` as const,
    /** Reject a pending product (Admin / Authority) */
    REJECT: (id: string) => `/manage/products/${id}/reject` as const,
    /** Activate a product (owner if approved, or Admin / Authority) */
    ACTIVATE: (id: string) => `/manage/products/${id}/activate` as const,
    /** Deactivate a product (owner if approved, or Admin / Authority) */
    DEACTIVATE: (id: string) => `/manage/products/${id}/deactivate` as const,
    /** Multipart upload endpoint for product gallery images */
    UPLOAD_IMAGE: (productId: string) =>
      `/manage/products/${productId}/images` as const,
    /** Soft-delete a single product image by its image ID */
    DELETE_IMAGE: (imageId: string) =>
      `/manage/products/images/${imageId}` as const,
    /** Promote a specific image to primary / cover */
    SET_IMAGE_PRIMARY: (imageId: string) =>
      `/manage/products/images/${imageId}/set-primary` as const,
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
