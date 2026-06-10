namespace Bio.Domain.Entities;

public class ChatMessage
{
    public Guid Id { get; private set; }
    public Guid SessionId { get; private set; }
    public string Role { get; private set; } = string.Empty; // 'user' or 'assistant'
    public string Content { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public ChatSession Session { get; private set; } = null!;

    private ChatMessage() { }

    public ChatMessage(Guid sessionId, string role, string content)
    {
        Id = Guid.NewGuid();
        SessionId = sessionId;
        Role = role;
        Content = content;
    }
}
