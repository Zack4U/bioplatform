namespace Bio.Application.DTOs;

// =============================================================================
// COMMUNITY — Posts
// =============================================================================

/// <summary>Request DTO to create a community post.</summary>
public record CommunityPostCreateDTO
{
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty; // HTML sanitized
    public string? Category { get; init; }
}

/// <summary>Request DTO to update a community post (all fields optional).</summary>
public record CommunityPostUpdateDTO
{
    public string? Title { get; init; }
    public string? Content { get; init; }
    public string? Category { get; init; }
    public string? Status { get; init; } // Draft, Published, Archived, Hidden
}

/// <summary>Response DTO for community post list items.</summary>
public record CommunityPostListItemDTO(
    Guid Id,
    Guid AuthorUserId,
    string AuthorName,
    string Title,
    string Content,
    string? Category,
    string Status,
    bool IsPinned,
    int LikesCount,
    int DislikesCount,
    int CommentCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

/// <summary>Response DTO for full community post detail with comments.</summary>
public record CommunityPostDetailDTO(
    Guid Id,
    Guid AuthorUserId,
    string AuthorName,
    string Title,
    string Content,
    string? Category,
    string Status,
    bool IsPinned,
    int LikesCount,
    int DislikesCount,
    int CommentCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

// =============================================================================
// COMMUNITY — Comments
// =============================================================================

/// <summary>Request DTO to create a comment on a post.</summary>
public record CommunityCommentCreateDTO
{
    public string Content { get; init; } = string.Empty; // HTML sanitized
}

/// <summary>Request DTO to update a comment.</summary>
public record CommunityCommentUpdateDTO
{
    public string Content { get; init; } = string.Empty;
}

/// <summary>Response DTO for a community comment.</summary>
public record CommunityCommentResponseDTO(
    Guid Id,
    Guid PostId,
    Guid AuthorUserId,
    string AuthorName,
    string Content,
    bool IsDeleted,
    int LikesCount,
    int DislikesCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

// =============================================================================
// COMMUNITY — Reactions
// =============================================================================

/// <summary>Request DTO to toggle a reaction (Like or Dislike) on a post or comment.</summary>
public record CommunityReactionToggleDTO
{
    public string TargetType { get; init; } = string.Empty; // "Post" or "Comment"
    public Guid TargetId { get; init; }
    public string ReactionType { get; init; } = string.Empty; // "Like" or "Dislike"
}

/// <summary>Response DTO for a toggle reaction operation.</summary>
public record CommunityReactionResultDTO(
    bool Removed,   // true if reaction was removed (same type toggled off)
    bool Changed,   // true if reaction type changed (e.g. Like -> Dislike)
    string? CurrentReactionType, // null if removed
    int LikesCount,
    int DislikesCount);

// =============================================================================
// NETWORKING — User Connections
// =============================================================================

/// <summary>Request DTO to send a connection request to another user.</summary>
public record UserConnectionRequestDTO
{
    public Guid AddresseeId { get; init; }
    public string? Message { get; init; }
}

/// <summary>Request DTO to respond to a connection request.</summary>
public record UserConnectionRespondDTO
{
    public string Action { get; init; } = string.Empty; // "Accept", "Reject", "Block"
}

/// <summary>Response DTO for a user connection.</summary>
public record UserConnectionResponseDTO(
    Guid Id,
    Guid RequesterId,
    string RequesterName,
    Guid AddresseeId,
    string AddresseeName,
    string Status,
    string? Message,
    DateTime CreatedAt,
    DateTime? RespondedAt);

// =============================================================================
// MESSAGING — Direct Threads & Messages
// =============================================================================

/// <summary>Request DTO to create a direct 1:1 or group thread.</summary>
public record CreateDirectThreadDTO
{
    public string ThreadType { get; init; } = "Direct"; // "Direct" or "Group"
    public string? Title { get; init; }
    public IReadOnlyList<Guid> ParticipantIds { get; init; } = Array.Empty<Guid>();
}

/// <summary>Response DTO for a direct message thread summary.</summary>
public record DirectThreadSummaryDTO(
    Guid Id,
    string? Title,
    string ThreadType,
    int ParticipantCount,
    int UnreadCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    /// <summary>Full name of the other participant for Direct threads. Null for Group threads.</summary>
    string? OtherParticipantName = null,
    Guid? OtherParticipantId = null);

/// <summary>Request DTO to send a message in a thread.</summary>
public record SendDirectMessageDTO
{
    public string Content { get; init; } = string.Empty; // HTML sanitized
}

/// <summary>Response DTO for a direct message.</summary>
public record DirectMessageResponseDTO(
    Guid Id,
    Guid ThreadId,
    Guid SenderUserId,
    string SenderName,
    string Content,
    bool IsDeleted,
    DateTime CreatedAt,
    bool IsRead);

/// <summary>Response DTO for unread message count.</summary>
public record UnreadCountResponseDTO(int UnreadCount);

// =============================================================================
// GEOGRAPHIC DISTRIBUTION — Species (add/delete)
// =============================================================================

/// <summary>Request DTO to add a geographic distribution point for a species.</summary>
public record GeographicDistributionCreateDTO
{
    public double Latitude { get; init; }
    public double Longitude { get; init; }
    public double? Altitude { get; init; }
    public string? Municipality { get; init; }
    public string? EcosystemType { get; init; }
}
