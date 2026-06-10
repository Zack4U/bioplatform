namespace Bio.Domain.Entities;

/// <summary>
/// Individual messages within a direct thread.
/// Table: DirectMessages (SQL Server).
/// </summary>
public class DirectMessage
{
    public Guid Id { get; private set; }
    public Guid ThreadId { get; private set; }
    public Guid SenderUserId { get; private set; }
    public string Content { get; private set; } = string.Empty; // HTML sanitizado
    public bool IsDeleted { get; private set; } = false;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    // Navigation properties
    public DirectThread Thread { get; private set; } = null!;
    public User SenderUser { get; private set; } = null!;
    public ICollection<DirectMessageRead> Reads { get; private set; } = new List<DirectMessageRead>();

    private DirectMessage() { }

    public DirectMessage(Guid threadId, Guid senderUserId, string content)
    {
        Id = Guid.NewGuid();
        ThreadId = threadId;
        SenderUserId = senderUserId;
        Content = content;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
    }
}
