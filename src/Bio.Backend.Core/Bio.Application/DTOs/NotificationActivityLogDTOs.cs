namespace Bio.Application.DTOs;

// =============================================================================
// NOTIFICATIONS
// =============================================================================

public record NotificationResponseDTO(
    Guid Id,
    string Title,
    string Message,
    string NotificationType,
    string? ReferenceType,
    Guid? ReferenceId,
    bool IsRead,
    DateTime CreatedAt,
    DateTime? ReadAt);

public record NotificationFilterParams
{
    public bool? IsRead { get; init; }
    public string? NotificationType { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

public record UnreadNotificationCountDTO(int Count);

// =============================================================================
// ACTIVITY LOGS
// =============================================================================

public record ActivityLogResponseDTO(
    Guid Id,
    Guid? ActorUserId,
    string ActorType,
    string ActionType,
    string ImpactLevel,
    string TargetType,
    Guid? TargetId,
    string Summary,
    string? ChangeSet,
    string? Metadata,
    string? IpAddress,
    string? UserAgent,
    DateTime CreatedAt);

public record ActivityLogFilterParams
{
    public Guid? ActorUserId { get; init; }
    public string? ActorType { get; init; }
    public string? ActionType { get; init; }
    public string? ImpactLevel { get; init; }
    public string? TargetType { get; init; }
    public Guid? TargetId { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 25;
}

// =============================================================================
// REVOKE CERTIFICATION
// =============================================================================

public record RevokeCertificationDTO
{
    public string? Reason { get; init; }
}
