using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

public interface IOrderRepository
{
    Task<Order?> GetByIdWithItemsAsync(Guid id, CancellationToken ct = default);
    Task<(IReadOnlyList<Order> Items, int TotalCount)> GetByBuyerIdAsync(
        Guid buyerId, int page = 1, int pageSize = 10, CancellationToken ct = default);
    Task<(IReadOnlyList<Order> Items, int TotalCount)> GetManagedAsync(
        string? status = null, int page = 1, int pageSize = 10, CancellationToken ct = default);

    /// <summary>Returns orders containing products sold by the given entrepreneur.</summary>
    Task<(IReadOnlyList<Order> Items, int TotalCount)> GetByEntrepreneurIdAsync(
        Guid entrepreneurId, string? status = null, int page = 1, int pageSize = 10,
        CancellationToken ct = default, DateTime? fromDate = null);

    /// <summary>Returns true if the buyer has any Delivered or Paid order containing the product.</summary>
    Task<bool> HasPurchasedProductAsync(Guid buyerId, Guid productId, CancellationToken ct = default);

    Task AddAsync(Order order, CancellationToken ct = default);
    Task<string> GenerateOrderNumberAsync(CancellationToken ct = default);
}
