/**
 * TypeScript types for Community, Networking, Messaging, and Notifications.
 * Mirrors the backend DTOs in CommunityNetworkingDTOs.cs and NotificationActivityLogDTOs.cs.
 *
 * @module types/community
 */

// =============================================================================
// COMMUNITY — Posts
// =============================================================================

export type PostStatus = "Draft" | "Published" | "Archived" | "Hidden";

export const POST_CATEGORIES_LIST = [
    "General",
    "Biodiversidad",
    "Investigacion",
    "Emprendimiento",
    "Conservacion",
    "Avistamientos",
    "Eventos",
] as const;

export type PostCategory = (typeof POST_CATEGORIES_LIST)[number];

/** Request DTO to create a community post */
export interface CommunityPostCreateDTO {
    title: string;
    content: string;
    category?: string | null;
}

/** Request DTO to update a community post */
export interface CommunityPostUpdateDTO {
    title?: string | null;
    content?: string | null;
    category?: string | null;
    status?: PostStatus | null;
}

/** Response DTO for community post list items */
export interface CommunityPostListItem {
    id: string;
    authorUserId: string;
    authorName: string;
    title: string;
    category: string | null;
    status: PostStatus;
    isPinned: boolean;
    likesCount: number;
    dislikesCount: number;
    commentCount: number;
    createdAt: string;
    updatedAt: string | null;
}

/** Response DTO for full community post detail */
export interface CommunityPostDetail {
    id: string;
    authorUserId: string;
    authorName: string;
    title: string;
    content: string;
    category: string | null;
    status: PostStatus;
    isPinned: boolean;
    likesCount: number;
    dislikesCount: number;
    commentCount: number;
    createdAt: string;
    updatedAt: string | null;
}

// =============================================================================
// COMMUNITY — Comments
// =============================================================================

/** Request DTO to create a comment */
export interface CommunityCommentCreateDTO {
    content: string;
}

/** Request DTO to update a comment */
export interface CommunityCommentUpdateDTO {
    content: string;
}

/** Response DTO for a community comment */
export interface CommunityCommentResponse {
    id: string;
    postId: string;
    authorUserId: string;
    authorName: string;
    content: string;
    isDeleted: boolean;
    likesCount: number;
    dislikesCount: number;
    createdAt: string;
    updatedAt: string | null;
}

// =============================================================================
// COMMUNITY — Reactions
// =============================================================================

export type ReactionTargetType = "Post" | "Comment";
export type ReactionType = "Like" | "Dislike";

/** Request DTO to toggle a reaction */
export interface CommunityReactionToggleDTO {
    targetType: ReactionTargetType;
    targetId: string;
    reactionType: ReactionType;
}

/** Response DTO for a reaction toggle */
export interface CommunityReactionResult {
    removed: boolean;
    changed: boolean;
    currentReactionType: ReactionType | null;
    likesCount: number;
    dislikesCount: number;
}

// =============================================================================
// NETWORKING — Connections
// =============================================================================

export type ConnectionStatus = "Pending" | "Accepted" | "Rejected" | "Blocked";
export type ConnectionAction = "Accept" | "Reject" | "Block";

/** Request DTO to send a connection request */
export interface UserConnectionRequestDTO {
    addresseeId: string;
    message?: string | null;
}

/** Request DTO to respond to a connection request */
export interface UserConnectionRespondDTO {
    action: ConnectionAction;
}

/** Response DTO for a user connection */
export interface UserConnectionResponse {
    id: string;
    requesterId: string;
    requesterName: string;
    addresseeId: string;
    addresseeName: string;
    status: ConnectionStatus;
    message: string | null;
    createdAt: string;
    respondedAt: string | null;
}

// =============================================================================
// MESSAGING — Threads & Messages
// =============================================================================

export type ThreadType = "Direct" | "Group";

/** Request DTO to create a thread */
export interface CreateDirectThreadDTO {
    threadType: ThreadType;
    title?: string | null;
    participantIds: string[];
}

/** Response DTO for a thread summary */
export interface DirectThreadSummary {
    id: string;
    title: string | null;
    threadType: ThreadType;
    participantCount: number;
    unreadCount: number;
    createdAt: string;
    updatedAt: string | null;
    /** Populated on the frontend from participants data */
    otherParticipantName?: string | null;
    otherParticipantId?: string | null;
    lastMessagePreview?: string | null;
}

/** Request DTO to send a message */
export interface SendDirectMessageDTO {
    content: string;
}

/** Response DTO for a direct message */
export interface DirectMessageResponse {
    id: string;
    threadId: string;
    senderUserId: string;
    senderName: string;
    content: string;
    isDeleted: boolean;
    createdAt: string;
    isRead: boolean;
}

/** Unread message count response */
export interface UnreadCountResponse {
    unreadCount: number;
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export type NotificationType =
    | "reaction"
    | "comment"
    | "connection_request"
    | "connection_accepted"
    | "message"
    | "system"
    | "order"
    | "permit";

/** Response DTO for a notification */
export interface NotificationResponse {
    id: string;
    userId: string;
    title: string;
    message: string;
    notificationType: string;
    referenceType: string | null;
    referenceId: string | null;
    isRead: boolean;
    createdAt: string;
    readAt: string | null;
}

/** Unread notification count response */
export interface UnreadNotificationCount {
    unreadCount: number;
}

// =============================================================================
// ADMIN — Community Management
// =============================================================================

export interface AdminPostFilters {
    category?: string;
    status?: PostStatus;
    query?: string;
    page?: number;
    pageSize?: number;
}

export interface AdminConnectionFilters {
    status?: ConnectionStatus;
    query?: string;
    page?: number;
    pageSize?: number;
}
