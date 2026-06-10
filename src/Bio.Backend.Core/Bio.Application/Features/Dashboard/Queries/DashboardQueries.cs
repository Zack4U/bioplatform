using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Dashboard.Queries;

public record GetSellerDashboardQuery(Guid EntrepreneurId) : IRequest<SellerDashboardDTO>;

public class GetSellerDashboardQueryHandler
    : IRequestHandler<GetSellerDashboardQuery, SellerDashboardDTO>
{
    private readonly IProductRepository _productRepo;
    private readonly IOrderRepository _orderRepo;
    private readonly IProductReviewRepository _reviewRepo;

    private const int LowStockThreshold = 5;

    public GetSellerDashboardQueryHandler(
        IProductRepository productRepo,
        IOrderRepository orderRepo,
        IProductReviewRepository reviewRepo)
    { _productRepo = productRepo; _orderRepo = orderRepo; _reviewRepo = reviewRepo; }

    public async Task<SellerDashboardDTO> Handle(GetSellerDashboardQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var (products, _) = await _productRepo.GetManagedFilteredAsync(
            request.EntrepreneurId, null, null, null, "name", "asc", 1, 1000, ct);
        var (allOrders, _) = await _orderRepo.GetByEntrepreneurIdAsync(request.EntrepreneurId, null, 1, 10000, ct);
        var (monthOrders, _) = await _orderRepo.GetByEntrepreneurIdAsync(request.EntrepreneurId, null, 1, 10000, ct, monthStart);
        var (avgRating, reviewCount) = await _reviewRepo.GetAggregateByEntrepreneurIdAsync(request.EntrepreneurId, ct);

        // Compute metrics
        var allOrdersList = allOrders.ToList();
        var monthOrdersList = monthOrders.ToList();
        var productsList = products.ToList();

        var totalSalesAllTime = allOrdersList
            .Where(o => o.Status != "Cancelled" && o.Status != "Refunded")
            .Sum(o => o.TotalAmount);

        var totalSalesThisMonth = monthOrdersList
            .Where(o => o.Status != "Cancelled" && o.Status != "Refunded")
            .Sum(o => o.TotalAmount);

        var ordersByStatus = allOrdersList
            .GroupBy(o => o.Status)
            .Select(g => new OrderStatusCountDTO(g.Key, g.Count()))
            .ToList();

        // Top 5 products by total revenue
        var topProducts = allOrdersList
            .Where(o => o.Status != "Cancelled" && o.Status != "Refunded")
            .SelectMany(o => o.OrderItems)
            .Where(i => productsList.Any(p => p.Id == i.ProductId))
            .GroupBy(i => i.ProductId)
            .Select(g =>
            {
                var prod = productsList.FirstOrDefault(p => p.Id == g.Key);
                return new TopProductDTO(
                    g.Key,
                    prod?.Name ?? "Unknown",
                    prod?.ThumbnailUrl,
                    g.Sum(i => i.Quantity),
                    g.Sum(i => i.TotalPrice));
            })
            .OrderByDescending(x => x.TotalRevenue)
            .Take(5)
            .ToList();

        var lowStockProducts = productsList
            .Where(p => p.StockQuantity <= LowStockThreshold)
            .Select(p => new LowStockProductDTO(p.Id, p.Name, p.StockQuantity))
            .OrderBy(p => p.StockQuantity)
            .ToList();

        return new SellerDashboardDTO(
            TotalSalesThisMonth: totalSalesThisMonth,
            TotalSalesAllTime: totalSalesAllTime,
            TotalOrdersThisMonth: monthOrdersList.Count,
            TotalOrdersAllTime: allOrdersList.Count,
            OrdersByStatus: ordersByStatus,
            TopProducts: topProducts,
            AverageRating: avgRating,
            TotalReviews: reviewCount,
            TotalProducts: productsList.Count,
            ActiveProducts: productsList.Count(p => p.IsActive),
            LowStockProducts: lowStockProducts);
    }
}
