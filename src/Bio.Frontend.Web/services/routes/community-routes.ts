/**
 * Centralized API route constants for Community, Networking, Messaging, and Notifications.
 *
 * Base path: /api (prepended by Axios baseURL from constants.ts)
 * Controllers use /api/v1/* prefix.
 *
 * @module services/routes/community-routes
 */

export const COMMUNITY_ROUTES = {
    /** CommunityController — /api/v1/community */
    POSTS: {
        BASE: "/v1/community/posts",
        BY_ID: (id: string) => `/v1/community/posts/${id}` as const,
        PIN: (id: string) => `/v1/community/posts/${id}/pin` as const,
        COMMENTS: (postId: string) => `/v1/community/posts/${postId}/comments` as const,
        COMMENT_BY_ID: (postId: string, commentId: string) =>
            `/v1/community/posts/${postId}/comments/${commentId}` as const,
    },
    REACTIONS: {
        TOGGLE: "/v1/community/reactions",
    },

    /** NetworkingController — /api/v1/networking */
    NETWORKING: {
        CONNECTIONS: "/v1/networking/connections",
        PENDING: "/v1/networking/connections/pending",
        BY_ID: (id: string) => `/v1/networking/connections/${id}` as const,
        RESPOND: (id: string) => `/v1/networking/connections/${id}/respond` as const,
        /** Sent pending requests: same endpoint as CONNECTIONS but filtered by status=Pending */
        SENT: "/v1/networking/connections",
    },

    /** MessagingController — /api/v1/messaging */
    MESSAGING: {
        THREADS: "/v1/messaging/threads",
        MESSAGES: (threadId: string) => `/v1/messaging/threads/${threadId}/messages` as const,
        MARK_READ: (threadId: string) =>
            `/v1/messaging/threads/${threadId}/messages/read` as const,
        UNREAD_COUNT: "/v1/messaging/unread-count",
    },

    /** NotificationsController — /api/v1/notifications */
    NOTIFICATIONS: {
        BASE: "/v1/notifications",
        UNREAD_COUNT: "/v1/notifications/unread-count",
        MARK_READ: (id: string) => `/v1/notifications/${id}/read` as const,
        MARK_ALL_READ: "/v1/notifications/read-all",
        DELETE: (id: string) => `/v1/notifications/${id}` as const,
    },
} as const;
