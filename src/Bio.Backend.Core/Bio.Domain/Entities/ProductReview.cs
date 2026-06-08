namespace Bio.Domain.Entities;

/// <summary>
/// Ratings and reviews of products by buyers.
/// Table: ProductReviews (SQL Server).
/// </summary>
public class ProductReview
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid UserId { get; private set; }
    public int Rating { get; private set; }
    public string? Title { get; private set; }
    public string? Comment { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public bool IsReported { get; private set; }
    public string? ReportReason { get; private set; }
    public Guid? ReportedById { get; private set; }
    public DateTime? ReportedAt { get; private set; }

    // Navigation properties
    public Product Product { get; private set; } = null!;
    public User User { get; private set; } = null!;
    public User? ReportedBy { get; private set; }

    private ProductReview() { }

    public ProductReview(Guid productId, Guid userId, int rating, string? title, string? comment)
    {
        if (rating < 1 || rating > 5) throw new ArgumentException("Rating must be between 1 and 5.", nameof(rating));

        Id = Guid.NewGuid();
        ProductId = productId;
        UserId = userId;
        Rating = rating;
        Title = title;
        Comment = comment;
    }

    /// <summary>
    /// Updates the review content. Only the owner can update their own review.
    /// </summary>
    public void Update(int? rating, string? title, string? comment)
    {
        if (rating.HasValue)
        {
            if (rating.Value < 1 || rating.Value > 5)
                throw new ArgumentException("Rating must be between 1 and 5.", nameof(rating));
            Rating = rating.Value;
        }
        if (title != null) Title = title;
        if (comment != null) Comment = comment;
    }

    /// <summary>
    /// Toggles the report flag on this review. Used by entrepreneurs to flag reviews
    /// on their products for admin moderation.
    /// </summary>
    public void ToggleReport(Guid reportedById, string? reason)
    {
        if (IsReported)
        {
            IsReported = false;
            ReportReason = null;
            ReportedById = null;
            ReportedAt = null;
        }
        else
        {
            IsReported = true;
            ReportReason = reason;
            ReportedById = reportedById;
            ReportedAt = DateTime.UtcNow;
        }
    }
}
