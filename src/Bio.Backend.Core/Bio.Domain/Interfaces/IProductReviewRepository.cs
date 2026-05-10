using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

public interface IProductReviewRepository
{
    Task<(IReadOnlyList<ProductReview> Items, int TotalCount)> GetByProductIdAsync(
        Guid productId, int page = 1, int pageSize = 10, CancellationToken ct = default);
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
