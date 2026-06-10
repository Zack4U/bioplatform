namespace Bio.Domain.Entities;

public class ChatSession
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; } // Logical FK to SQL Server
    public string? ContextTopic { get; private set; }
    public DateTime StartedAt { get; private set; } = DateTime.UtcNow;

    public ICollection<ChatMessage> Messages { get; private set; } = new List<ChatMessage>();

    private ChatSession() { }

    public ChatSession(Guid userId, string? contextTopic)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        ContextTopic = contextTopic;
    }
}
