namespace Bio.Domain.Entities;

/// <summary>
/// User favorite/wishlist entry. Supports favoriting both products and species
/// using a polymorphic TargetType + TargetId pattern.
/// Table: Favorites (SQL Server).
/// </summary>
public class Favorite
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string TargetType { get; private set; } = string.Empty;
    public Guid TargetId { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public User User { get; private set; } = null!;

    private Favorite() { }

    public Favorite(Guid userId, string targetType, Guid targetId)
    {
        if (userId == Guid.Empty) throw new ArgumentException("User ID cannot be empty.", nameof(userId));
        if (string.IsNullOrWhiteSpace(targetType)) throw new ArgumentException("Target type is required.", nameof(targetType));
        if (targetId == Guid.Empty) throw new ArgumentException("Target ID cannot be empty.", nameof(targetId));

        Id = Guid.NewGuid();
        UserId = userId;
        TargetType = targetType;
        TargetId = targetId;
    }
}
