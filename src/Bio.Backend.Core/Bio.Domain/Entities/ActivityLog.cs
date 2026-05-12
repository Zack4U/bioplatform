namespace Bio.Domain.Entities;

/// <summary>
/// Centralized audit log for platform activity.
/// Table: ActivityLogs (SQL Server).
/// </summary>
public class ActivityLog
{
    public Guid Id { get; private set; }
    public Guid? ActorUserId { get; private set; }
    public string ActorType { get; private set; } = string.Empty; // User, System, Service
    public string ActionType { get; private set; } = string.Empty; // Insert, Update, Delete, Read, Login, Logout, Approve, Reject, Other
    public string ImpactLevel { get; private set; } = string.Empty; // Low, Medium, High, Critical
    public string TargetType { get; private set; } = string.Empty; // Product, Order, Species, AbsPermit, etc.
    public Guid? TargetId { get; private set; }
    public string Summary { get; private set; } = string.Empty;
    public string? ChangeSet { get; private set; } // JSON diff before/after
    public string? Metadata { get; private set; } // JSON extra context
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    // Navigation property
    public User? ActorUser { get; private set; }

    private ActivityLog() { }

    public ActivityLog(
        string actorType,
        string actionType,
        string impactLevel,
        string targetType,
        string summary,
        Guid? actorUserId = null,
        Guid? targetId = null,
        string? changeSet = null,
        string? metadata = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        Id = Guid.NewGuid();
        ActorType = actorType;
        ActionType = actionType;
        ImpactLevel = impactLevel;
        TargetType = targetType;
        Summary = summary;
        ActorUserId = actorUserId;
        TargetId = targetId;
        ChangeSet = changeSet;
        Metadata = metadata;
        IpAddress = ipAddress;
        UserAgent = userAgent;
    }
}
