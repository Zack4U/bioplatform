namespace Bio.Domain.Entities;

/// <summary>
/// Read receipt per user for direct messages.
/// Table: DirectMessageReads (SQL Server).
/// Composite PK: (MessageId, UserId).
/// </summary>
public class DirectMessageRead
{
    public Guid MessageId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime ReadAt { get; private set; } = DateTime.UtcNow;

    // Navigation properties
    public DirectMessage Message { get; private set; } = null!;
    public User User { get; private set; } = null!;

    private DirectMessageRead() { }

    public DirectMessageRead(Guid messageId, Guid userId)
    {
        MessageId = messageId;
        UserId = userId;
    }
}
