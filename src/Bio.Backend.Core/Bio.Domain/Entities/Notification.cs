namespace Bio.Domain.Entities;

/// <summary>
/// In-app notification for order updates, review responses, permit alerts, and system messages.
/// Table: Notifications (SQL Server).
/// </summary>
public class Notification
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public string NotificationType { get; private set; } = string.Empty;
    public string? ReferenceType { get; private set; }
    public Guid? ReferenceId { get; private set; }
    public bool IsRead { get; private set; } = false;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; private set; }

    public User User { get; private set; } = null!;

    private Notification() { }

    public Notification(
        Guid userId,
        string title,
        string message,
        string notificationType,
        string? referenceType = null,
        Guid? referenceId = null)
    {
        if (userId == Guid.Empty) throw new ArgumentException("User ID cannot be empty.", nameof(userId));

        Id = Guid.NewGuid();
        UserId = userId;
        Title = title;
        Message = message;
        NotificationType = notificationType;
        ReferenceType = referenceType;
        ReferenceId = referenceId;
    }

    public void MarkAsRead()
    {
        IsRead = true;
        ReadAt = DateTime.UtcNow;
    }
}
