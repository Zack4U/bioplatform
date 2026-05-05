namespace Bio.Domain.Entities;

/// <summary>
/// Participants of each message thread.
/// Table: DirectThreadParticipants (SQL Server).
/// Composite PK: (ThreadId, UserId).
/// </summary>
public class DirectThreadParticipant
{
    public Guid ThreadId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime JoinedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? LeftAt { get; private set; }
    public bool IsMuted { get; private set; } = false;

    // Navigation properties
    public DirectThread Thread { get; private set; } = null!;
    public User User { get; private set; } = null!;

    private DirectThreadParticipant() { }

    public DirectThreadParticipant(Guid threadId, Guid userId)
    {
        ThreadId = threadId;
        UserId = userId;
    }

    public void Leave() => LeftAt = DateTime.UtcNow;
    public void Mute() => IsMuted = true;
    public void Unmute() => IsMuted = false;
}
