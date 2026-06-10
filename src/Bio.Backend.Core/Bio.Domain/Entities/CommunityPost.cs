namespace Bio.Domain.Entities;

/// <summary>
/// Community forum posts and networking publications.
/// Table: CommunityPosts (SQL Server).
/// </summary>
public class CommunityPost
{
    public Guid Id { get; private set; }
    public Guid AuthorUserId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty; // HTML sanitizado
    public string? Category { get; private set; }
    public string Status { get; private set; } = "Published"; // Draft, Published, Archived, Hidden
    public bool IsPinned { get; private set; } = false;
    public int LikesCount { get; private set; } = 0;
    public int DislikesCount { get; private set; } = 0;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties
    public User AuthorUser { get; private set; } = null!;
    public ICollection<CommunityPostComment> Comments { get; private set; } = new List<CommunityPostComment>();

    private CommunityPost() { }

    public CommunityPost(Guid authorUserId, string title, string content, string? category = null)
    {
        Id = Guid.NewGuid();
        AuthorUserId = authorUserId;
        Title = title;
        Content = content;
        Category = category;
    }

    public void Update(string? title, string? content, string? category, string? status)
    {
        if (title != null) Title = title;
        if (content != null) Content = content;
        if (category != null) Category = category;
        if (status != null) Status = status;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Pin() { IsPinned = true; UpdatedAt = DateTime.UtcNow; }
    public void Unpin() { IsPinned = false; UpdatedAt = DateTime.UtcNow; }

    /// <summary>Moderation: archive a post (author/admin self-service — no longer shown in active feeds).</summary>
    public void Archive() { Status = "Archived"; UpdatedAt = DateTime.UtcNow; }
    public void Unarchive() { Status = "Published"; UpdatedAt = DateTime.UtcNow; }

    /// <summary>Moderation: hide a post (Admin/Community moderator — content violates guidelines).</summary>
    public void Hide() { Status = "Hidden"; UpdatedAt = DateTime.UtcNow; }
    public void Unhide() { Status = "Published"; UpdatedAt = DateTime.UtcNow; }

    public void IncrementLikes() => LikesCount++;
    public void DecrementLikes() { if (LikesCount > 0) LikesCount--; }
    public void IncrementDislikes() => DislikesCount++;
    public void DecrementDislikes() { if (DislikesCount > 0) DislikesCount--; }
}
