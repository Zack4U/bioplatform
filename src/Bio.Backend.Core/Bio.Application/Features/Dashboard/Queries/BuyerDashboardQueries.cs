using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Dashboard.Queries;

// =============================================================================
// BUYER DASHBOARD
// =============================================================================

public record GetBuyerDashboardQuery(Guid BuyerId) : IRequest<BuyerDashboardDTO>;

public class GetBuyerDashboardQueryHandler : IRequestHandler<GetBuyerDashboardQuery, BuyerDashboardDTO>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IFavoriteRepository _favoriteRepo;
    private readonly IProductReviewRepository _reviewRepo;

    public GetBuyerDashboardQueryHandler(
        IOrderRepository orderRepo,
        IFavoriteRepository favoriteRepo,
        IProductReviewRepository reviewRepo)
    {
        _orderRepo = orderRepo; _favoriteRepo = favoriteRepo; _reviewRepo = reviewRepo;
    }

    public async Task<BuyerDashboardDTO> Handle(GetBuyerDashboardQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var ordersTask = _orderRepo.GetByBuyerIdAsync(request.BuyerId, 1, 10000, ct);
        var favProductsTask = _favoriteRepo.GetByUserIdAsync(request.BuyerId, "Product", 1, 10000, ct);
        var favSpeciesTask = _favoriteRepo.GetByUserIdAsync(request.BuyerId, "Species", 1, 10000, ct);
        var reviewsTask = _reviewRepo.GetByUserIdAsync(request.BuyerId, 1, 10000, ct);

        await Task.WhenAll(ordersTask, favProductsTask, favSpeciesTask, reviewsTask);

        var (orders, _) = await ordersTask;
        var (favProducts, favProductCount) = await favProductsTask;
        var (_, favSpeciesCount) = await favSpeciesTask;
        var (_, reviewCount) = await reviewsTask;

        var orderList = orders.ToList();
        var validOrders = orderList.Where(o => o.Status is not ("Cancelled" or "Refunded")).ToList();
        var monthOrders = validOrders.Where(o => o.CreatedAt >= monthStart).ToList();

        var byStatus = orderList.GroupBy(o => o.Status)
            .Select(g => new OrderStatusCountDTO(g.Key, g.Count())).ToList();

        var lastOrder = orderList
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderSummaryDTO(o.Id, o.OrderNumber, o.Status, o.TotalAmount, o.CreatedAt))
            .FirstOrDefault();

        return new BuyerDashboardDTO(
            TotalOrders: orderList.Count,
            TotalSpent: validOrders.Sum(o => o.TotalAmount),
            SpentThisMonth: monthOrders.Sum(o => o.TotalAmount),
            OrdersByStatus: byStatus,
            FavoriteProductsCount: favProductCount,
            FavoriteSpeciesCount: favSpeciesCount,
            ReviewsWritten: reviewCount,
            LastOrder: lastOrder);
    }
}
