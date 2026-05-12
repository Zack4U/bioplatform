namespace Bio.Domain.Entities;

/// <summary>
/// Networking connection requests and connections between users.
/// Table: UserConnections (SQL Server).
/// </summary>
public class UserConnection
{
    public Guid Id { get; private set; }
    public Guid RequesterId { get; private set; }
    public Guid AddresseeId { get; private set; }
    public string Status { get; private set; } = "Pending"; // Pending, Accepted, Rejected, Blocked
    public string? Message { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; private set; }

    // Navigation properties
    public User Requester { get; private set; } = null!;
    public User Addressee { get; private set; } = null!;

    private UserConnection() { }

    public UserConnection(Guid requesterId, Guid addresseeId, string? message = null)
    {
        Id = Guid.NewGuid();
        RequesterId = requesterId;
        AddresseeId = addresseeId;
        Message = message;
    }

    public void Accept()
    {
        Status = "Accepted";
        RespondedAt = DateTime.UtcNow;
    }

    public void Reject()
    {
        Status = "Rejected";
        RespondedAt = DateTime.UtcNow;
    }

    public void Block()
    {
        Status = "Blocked";
        RespondedAt = DateTime.UtcNow;
    }
}
