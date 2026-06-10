namespace Bio.Application.DTOs;

// =============================================================================
// PLATFORM REQUESTS — Aggregated view of all pending actions across the platform
// =============================================================================

/// <summary>
/// Unified representation of any pending action in the platform that requires admin/authority review.
/// Aggregates: ABS permit requests, image validations, product approvals, account verifications, certification reviews.
/// </summary>
public record PlatformRequestDTO(
    string Id,
    string Type,
    string TypeLabel,
    string RequesterId,
    string RequesterName,
    string Subject,
    string? Description,
    string Status,
    string? ReferenceId,
    string? ReferenceType,
    string? ReferenceUrl,
    string? ReviewerNotes,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record PlatformRequestFilterParams
{
    public string? Type { get; init; }
    public string? Status { get; init; }
    public string? Search { get; init; }
    /// <summary>Scopes results to requests submitted by this user — set server-side for non-reviewer roles.</summary>
    public Guid? RequesterId { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

public record ReviewPlatformRequestDTO
{
    public string Action { get; init; } = string.Empty; // "approve" | "reject" | "in_review"
    public string? Notes { get; init; }
}
