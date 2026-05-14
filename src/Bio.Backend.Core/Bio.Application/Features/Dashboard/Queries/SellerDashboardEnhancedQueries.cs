using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Dashboard.Queries;

// =============================================================================
// SELLER DASHBOARD ENHANCED (replaces GetSellerDashboardQuery)
// =============================================================================

public record GetSellerDashboardEnhancedQuery(
    Guid EntrepreneurId,
    int? Year = null,
    int? Month = null) : IRequest<SellerDashboardEnhancedDTO>;

public class GetSellerDashboardEnhancedQueryHandler
    : IRequestHandler<GetSellerDashboardEnhancedQuery, SellerDashboardEnhancedDTO>
{
    private readonly IProductRepository _productRepo;
    private readonly IOrderRepository _orderRepo;
    private readonly IProductReviewRepository _reviewRepo;
    private readonly IAbsPermitRepository _absRepo;
    private const int LowStockThreshold = 5;

    public GetSellerDashboardEnhancedQueryHandler(
        IProductRepository productRepo,
        IOrderRepository orderRepo,
        IProductReviewRepository reviewRepo,
        IAbsPermitRepository absRepo)
    {
        _productRepo = productRepo; _orderRepo = orderRepo;
        _reviewRepo = reviewRepo; _absRepo = absRepo;
    }

    public async Task<SellerDashboardEnhancedDTO> Handle(
        GetSellerDashboardEnhancedQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var year = request.Year ?? now.Year;
        var month = request.Month ?? now.Month;
        var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);

        var lastMonthStart = monthStart.AddMonths(-1);
        var day90 = now.AddDays(90);

        var productsTask = _productRepo.GetManagedFilteredAsync(
            request.EntrepreneurId, null, null, null, "name", "asc", 1, 1000, ct);
        var allOrdersTask = _orderRepo.GetByEntrepreneurIdAsync(
            request.EntrepreneurId, null, 1, 10000, ct);
        var monthOrdersTask = _orderRepo.GetByEntrepreneurIdAsync(
            request.EntrepreneurId, null, 1, 10000, ct, monthStart);
        var lastMonthOrdersTask = _orderRepo.GetByEntrepreneurIdAsync(
            request.EntrepreneurId, null, 1, 10000, ct, lastMonthStart);
        var reviewsTask = _reviewRepo.GetAggregateByEntrepreneurIdAsync(request.EntrepreneurId, ct);
        var absTask = _absRepo.GetByEntrepreneurIdAsync(request.EntrepreneurId, ct);

        await Task.WhenAll(productsTask, allOrdersTask, monthOrdersTask, lastMonthOrdersTask, reviewsTask, absTask);

        var (products, _) = await productsTask;
        var (allOrders, _) = await allOrdersTask;
        var (monthOrders, _) = await monthOrdersTask;
        var (lastMonthOrders, _) = await lastMonthOrdersTask;
        var (avgRating, reviewCount) = await reviewsTask;
        var permits = await absTask;

        var productsList = products.ToList();
        var allOrdersList = allOrders.ToList();
        var monthOrdersList = monthOrders.ToList();
        var lastMonthList = lastMonthOrders.ToList();
        var permitList = permits.ToList();

        // Core KPIs
        var validAll = allOrdersList.Where(o => o.Status is not ("Cancelled" or "Refunded")).ToList();
        var validMonth = monthOrdersList.Where(o => o.Status is not ("Cancelled" or "Refunded")).ToList();
        var validLastMonth = lastMonthList.Where(o => o.Status is not ("Cancelled" or "Refunded")).ToList();

        var byStatus = allOrdersList.GroupBy(o => o.Status)
            .Select(g => new OrderStatusCountDTO(g.Key, g.Count())).ToList();

        var topProducts = validAll
            .SelectMany(o => o.OrderItems)
            .Where(i => productsList.Any(p => p.Id == i.ProductId))
            .GroupBy(i => i.ProductId)
            .Select(g =>
            {
                var prod = productsList.FirstOrDefault(p => p.Id == g.Key);
                return new TopProductDTO(g.Key, prod?.Name ?? "Unknown", prod?.ThumbnailUrl,
                    g.Sum(i => i.Quantity), g.Sum(i => i.TotalPrice));
            })
            .OrderByDescending(x => x.TotalRevenue).Take(5).ToList();

        var lowStock = productsList
            .Where(p => p.StockQuantity <= LowStockThreshold)
            .Select(p => new LowStockProductDTO(p.Id, p.Name, p.StockQuantity))
            .OrderBy(p => p.StockQuantity).ToList();

        // Enhanced KPIs
        var revenueByCategory = validAll
            .SelectMany(o => o.OrderItems)
            .Where(i => productsList.Any(p => p.Id == i.ProductId))
            .GroupBy(i =>
            {
                var prod = productsList.FirstOrDefault(p => p.Id == i.ProductId);
                return prod?.Category?.Name ?? "Sin categoría";
            })
            .Select(g => new RevenueByCategoryDTO(g.Key, g.Sum(i => i.TotalPrice), g.Sum(i => i.Quantity)))
            .OrderByDescending(x => x.Revenue).ToList();

        // Rating distribution
        var ratingDistrib = Enumerable.Range(1, 5)
            .Select(stars => new RatingDistributionDTO(stars, 0))
            .ToList(); // Placeholder — requires per-review data; aggregated here as equal distribution

        var ordersWithReviewData = validAll
            .SelectMany(o => o.OrderItems)
            .Where(i => productsList.Any(p => p.Id == i.ProductId))
            .Count(); // Proxy for now; real rating distribution requires joining reviews table

        var productsWithoutCert = productsList.Count(p =>
            !p.Certifications.Any(c => c.Status == "Active"));

        var absExpiringIn90 = permitList.Count(p =>
            p.Status == "Active" && p.ExpirationDate <= day90);

        var batchCount = productsList.Sum(p => p.TraceabilityBatches?.Count ?? 0);

        return new SellerDashboardEnhancedDTO(
            TotalSalesThisMonth: validMonth.Sum(o => o.TotalAmount),
            TotalSalesAllTime: validAll.Sum(o => o.TotalAmount),
            TotalOrdersThisMonth: monthOrdersList.Count,
            TotalOrdersAllTime: allOrdersList.Count,
            OrdersByStatus: byStatus,
            TopProducts: topProducts,
            AverageRating: avgRating,
            TotalReviews: reviewCount,
            TotalProducts: productsList.Count,
            ActiveProducts: productsList.Count(p => p.IsActive),
            LowStockProducts: lowStock,
            RevenueLastMonth: validLastMonth.Sum(o => o.TotalAmount),
            RevenueByCategory: revenueByCategory,
            OrdersPendingShipment: allOrdersList.Count(o => o.Status == "Paid"),
            ProductsWithoutCertification: productsWithoutCert,
            AbsPermitsExpiringIn90Days: absExpiringIn90,
            TraceabilityBatchCount: batchCount,
            RatingDistribution: ratingDistrib);
    }
}
