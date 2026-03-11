namespace Bio.Domain.Entities;

public class ProductReview
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid UserId { get; private set; }
    public int Rating { get; private set; }
    public string? Title { get; private set; }
    public string? Comment { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public Product Product { get; private set; } = null!;
    public User User { get; private set; } = null!;

    private ProductReview() { }

    public ProductReview(Guid productId, Guid userId, int rating, string? title, string? comment)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        UserId = userId;
        Rating = rating;
        Title = title;
        Comment = comment;
    }
}
