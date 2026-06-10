using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

public interface IProductReviewRepository
{
    Task<(IReadOnlyList<ProductReview> Items, int TotalCount)> GetByProductIdAsync(
        Guid productId, int page = 1, int pageSize = 10, CancellationToken ct = default);

    /// <summary>
    /// Returns paginated reviews submitted by a specific user, with product info included.
    /// Used in the "My Reviews" profile tab.
    /// </summary>
    Task<(IReadOnlyList<ProductReview> Items, int TotalCount)> GetByUserIdAsync(
        Guid userId, int page = 1, int pageSize = 10, CancellationToken ct = default);

    /// <summary>
    /// Returns paginated reviews for moderation. When <paramref name="entrepreneurId"/> is set,
    /// scopes to reviews on that entrepreneur's products only (used by ENTREPRENEUR role).
    /// </summary>
    Task<(IReadOnlyList<ProductReview> Items, int TotalCount)> GetManagedAsync(
        Guid? entrepreneurId, bool? isReported, int page = 1, int pageSize = 10, CancellationToken ct = default);

    Task<ProductReview?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(ProductReview review, CancellationToken ct = default);
    Task DeleteAsync(ProductReview review, CancellationToken ct = default);
    Task<bool> ExistsByUserAndProductAsync(Guid userId, Guid productId, CancellationToken ct = default);

    /// <summary>
    /// Returns (averageRating, totalCount) for all products owned by the entrepreneur.
    /// Used by the seller dashboard.
    /// </summary>
    Task<(double AverageRating, int TotalCount)> GetAggregateByEntrepreneurIdAsync(
        Guid entrepreneurId, CancellationToken ct = default);
}
