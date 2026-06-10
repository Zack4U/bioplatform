namespace Bio.Domain.Entities;

/// <summary>
/// Direct conversation threads between users (1:1 or group networking).
/// Table: DirectThreads (SQL Server).
/// </summary>
public class DirectThread
{
    public Guid Id { get; private set; }
    public string? Title { get; private set; }
    public string ThreadType { get; private set; } = "Direct"; // Direct, Group
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties
    public ICollection<DirectThreadParticipant> Participants { get; private set; } = new List<DirectThreadParticipant>();
    public ICollection<DirectMessage> Messages { get; private set; } = new List<DirectMessage>();

    private DirectThread() { }

    public DirectThread(string threadType, string? title = null)
    {
        Id = Guid.NewGuid();
        ThreadType = threadType;
        Title = title;
    }

    public void UpdateActivity()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}
