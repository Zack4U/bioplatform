namespace Bio.Domain.Entities;

/// <summary>
/// Comments associated with community forum posts.
/// Table: CommunityPostComments (SQL Server).
/// </summary>
public class CommunityPostComment
{
    public Guid Id { get; private set; }
    public Guid PostId { get; private set; }
    public Guid AuthorUserId { get; private set; }
    public string Content { get; private set; } = string.Empty; // HTML sanitizado
    public bool IsDeleted { get; private set; } = false;
    public int LikesCount { get; private set; } = 0;
    public int DislikesCount { get; private set; } = 0;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties
    public CommunityPost Post { get; private set; } = null!;
    public User AuthorUser { get; private set; } = null!;

    private CommunityPostComment() { }

    public CommunityPostComment(Guid postId, Guid authorUserId, string content)
    {
        Id = Guid.NewGuid();
        PostId = postId;
        AuthorUserId = authorUserId;
        Content = content;
    }

    public void Update(string content)
    {
        Content = content;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementLikes() => LikesCount++;
    public void DecrementLikes() { if (LikesCount > 0) LikesCount--; }
    public void IncrementDislikes() => DislikesCount++;
    public void DecrementDislikes() { if (DislikesCount > 0) DislikesCount--; }
}
