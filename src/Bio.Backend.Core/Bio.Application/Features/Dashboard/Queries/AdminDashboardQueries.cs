using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Dashboard.Queries;

// =============================================================================
// ADMIN DASHBOARD
// =============================================================================

public record GetAdminDashboardQuery(
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int TopEntrepreneursCount = 5) : IRequest<AdminDashboardDTO>;

public class GetAdminDashboardQueryHandler : IRequestHandler<GetAdminDashboardQuery, AdminDashboardDTO>
{
    private readonly IUserRepository _userRepo;
    private readonly IProductRepository _productRepo;
    private readonly IOrderRepository _orderRepo;
    private readonly IAbsPermitRepository _absRepo;
    private readonly ICertificationRepository _certRepo;
    private readonly ICommunityPostRepository _postRepo;
    private readonly IUserConnectionRepository _connRepo;
    private readonly ICommunityPostCommentRepository _commentRepo;

    public GetAdminDashboardQueryHandler(
        IUserRepository userRepo,
        IProductRepository productRepo,
        IOrderRepository orderRepo,
        IAbsPermitRepository absRepo,
        ICertificationRepository certRepo,
        ICommunityPostRepository postRepo,
        IUserConnectionRepository connRepo,
        ICommunityPostCommentRepository commentRepo)
    {
        _userRepo = userRepo; _productRepo = productRepo; _orderRepo = orderRepo;
        _absRepo = absRepo; _certRepo = certRepo; _postRepo = postRepo;
        _connRepo = connRepo; _commentRepo = commentRepo;
    }

    public async Task<AdminDashboardDTO> Handle(GetAdminDashboardQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var day30 = now.AddDays(30);
        var day90 = now.AddDays(90);

        var allUsers = (await _userRepo.GetAllAsync()).ToList();
        var roleGroups = (await _userRepo.GetCountByRoleAsync(ct)).ToList();
        var (products, _) = await _productRepo.GetManagedFilteredAsync(null, null, null, null, "createdAt", "desc", 1, 10000, ct);
        var (allOrders, _) = await _orderRepo.GetManagedAsync(null, 1, 10000, ct);
        var (permits, _) = await _absRepo.GetAllPagedAsync(null, null, 1, 10000, ct);
        var (posts, _) = await _postRepo.GetPagedAsync(null, null, 1, 10000, ct);

        var productsList = products.ToList();
        var ordersList = allOrders.ToList();
        var permitsList = permits.ToList();
        var postsList = posts.ToList();

        // --- Users ---
        var newUsersThisMonth = allUsers.Count(u => u.CreatedAt >= monthStart);
        var userSummary = new AdminUserSummaryDTO(
            TotalUsers: allUsers.Count,
            ActiveUsers: allUsers.Count(u => u.IsActive),
            InactiveUsers: allUsers.Count(u => !u.IsActive),
            VerifiedUsers: allUsers.Count(u => u.IsVerified),
            NewUsersThisMonth: newUsersThisMonth,
            ByRole: roleGroups.Select(r => new RoleCountDTO(r.RoleName, r.Count)).ToList());

        // --- Marketplace ---
        const int LowStock = 5;
        var byCategory = productsList
            .GroupBy(p => p.Category?.Name ?? "Sin categoría")
            .Select(g => new CategoryCountDTO(g.Key, g.Count()))
            .OrderByDescending(x => x.Count).ToList();

        var marketplaceSummary = new AdminMarketplaceSummaryDTO(
            TotalProducts: productsList.Count,
            ActiveProducts: productsList.Count(p => p.IsActive),
            InactiveProducts: productsList.Count(p => !p.IsActive),
            LowStockProducts: productsList.Count(p => p.StockQuantity <= LowStock),
            ByCategory: byCategory);

        // --- Orders ---
        var validOrders = ordersList.Where(o => o.Status is not ("Cancelled" or "Refunded")).ToList();
        var monthOrders = ordersList.Where(o => o.CreatedAt >= monthStart).ToList();
        var byStatus = ordersList.GroupBy(o => o.Status)
            .Select(g => new OrderStatusCountDTO(g.Key, g.Count())).ToList();

        var orderSummary = new AdminOrderSummaryDTO(
            TotalOrders: ordersList.Count,
            TotalRevenue: validOrders.Sum(o => o.TotalAmount),
            RevenueThisMonth: monthOrders.Where(o => o.Status is not ("Cancelled" or "Refunded")).Sum(o => o.TotalAmount),
            OrdersThisMonth: monthOrders.Count,
            ByStatus: byStatus);

        // --- Compliance ---
        var certsByType = productsList
            .SelectMany(p => p.Certifications)
            .GroupBy(c => c.CertificationType)
            .Select(g => new CertTypeCountDTO(g.Key, g.Count())).ToList();

        var complianceSummary = new AdminComplianceSummaryDTO(
            TotalAbsPermits: permitsList.Count,
            ActiveAbsPermits: permitsList.Count(p => p.Status == "Active"),
            ExpiredAbsPermits: permitsList.Count(p => p.Status == "Expired"),
            SuspendedAbsPermits: permitsList.Count(p => p.Status == "Suspended"),
            RevokedAbsPermits: permitsList.Count(p => p.Status == "Revoked"),
            PermitsExpiringIn30Days: permitsList.Count(p => p.Status == "Active" && p.ExpirationDate <= day30),
            TotalCertifications: productsList.SelectMany(p => p.Certifications).Count(),
            CertificationsByType: certsByType);

        // --- Community ---
        var communitySummary = new AdminCommunitySummaryDTO(
            TotalPosts: postsList.Count,
            PublishedPosts: postsList.Count(p => p.Status == "Published"),
            HiddenPosts: postsList.Count(p => p.Status == "Hidden"),
            TotalComments: postsList.Sum(p => p.Comments?.Count ?? 0),
            TotalConnections: 0); // UserConnections count would require IUserConnectionRepository

        // --- Top Entrepreneurs ---
        var topEntrepreneurs = ordersList
            .Where(o => o.Status is not ("Cancelled" or "Refunded"))
            .SelectMany(o => o.OrderItems, (o, item) => (o, item))
            .Where(x => x.item.Product != null)
            .GroupBy(x => x.item.Product!.EntrepreneurId)
            .Select(g => new
            {
                EntrepreneurId = g.Key,
                Revenue = g.Sum(x => x.item.TotalPrice),
                Orders = g.Select(x => x.o.Id).Distinct().Count()
            })
            .OrderByDescending(x => x.Revenue)
            .Take(request.TopEntrepreneursCount)
            .Select(x =>
            {
                var user = allUsers.FirstOrDefault(u => u.Id == x.EntrepreneurId);
                return new TopEntrepreneurDTO(x.EntrepreneurId, user?.FullName ?? "Unknown",
                    user?.Email ?? "", x.Revenue, x.Orders);
            })
            .ToList();

        return new AdminDashboardDTO(
            Users: userSummary,
            Marketplace: marketplaceSummary,
            Orders: orderSummary,
            Compliance: complianceSummary,
            Community: communitySummary,
            TopEntrepreneurs: topEntrepreneurs,
            GeneratedAt: now);
    }
}
