namespace Bio.Domain.Entities;

/// <summary>
/// Individual reactions to prevent duplicate votes (like/dislike) on posts or comments.
/// Table: CommunityReactions (SQL Server).
/// </summary>
public class CommunityReaction
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string TargetType { get; private set; } = string.Empty; // Post, Comment
    public Guid TargetId { get; private set; }
    public string ReactionType { get; private set; } = string.Empty; // Like, Dislike
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    // Navigation property
    public User User { get; private set; } = null!;

    private CommunityReaction() { }

    public CommunityReaction(Guid userId, string targetType, Guid targetId, string reactionType)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        TargetType = targetType;
        TargetId = targetId;
        ReactionType = reactionType;
    }

    /// <summary>
    /// Toggles the reaction type (e.g., Like to Dislike).
    /// </summary>
    public void ChangeReactionType(string newReactionType)
    {
        ReactionType = newReactionType;
    }
}
