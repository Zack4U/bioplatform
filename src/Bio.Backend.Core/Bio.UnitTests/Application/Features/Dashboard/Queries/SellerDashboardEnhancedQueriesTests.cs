using Bio.Application.DTOs;
using Bio.Application.Features.Dashboard.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Dashboard.Queries;

public class SellerDashboardEnhancedQueriesTests
{
    private readonly Mock<IProductRepository> _productRepoMock = new();
    private readonly Mock<IOrderRepository> _orderRepoMock = new();
    private readonly Mock<IProductReviewRepository> _reviewRepoMock = new();
    private readonly Mock<IAbsPermitRepository> _absRepoMock = new();

    [Fact]
    public async Task GetSellerDashboardEnhanced_ShouldReturnMetrics()
    {
        var entrepreneurId = Guid.NewGuid();
        var product = new Product(entrepreneurId, Guid.NewGuid(), "Name", "slug", "Desc", 10m, 10m, 3, null, null, null, null);
        var products = new List<Product> { product };

        var order = new Order(Guid.NewGuid(), "ORD1", 10m, 10m, "Card");
        var orders = new List<Order> { order };

        var permit = new AbsPermit(entrepreneurId, Guid.NewGuid(), "RES1", DateTime.UtcNow, DateTime.UtcNow.AddDays(40), "Auth");
        var permits = new List<AbsPermit> { permit };

        _productRepoMock.Setup(r => r.GetManagedFilteredAsync(entrepreneurId, null, null, null, "name", "asc", 1, 1000, default))
            .ReturnsAsync((products, 1));
        _orderRepoMock.Setup(r => r.GetByEntrepreneurIdAsync(entrepreneurId, null, 1, 10000, default, null))
            .ReturnsAsync((orders, 1));
        _orderRepoMock.Setup(r => r.GetByEntrepreneurIdAsync(entrepreneurId, null, 1, 10000, default, It.IsAny<DateTime>()))
            .ReturnsAsync((orders, 1));
        _reviewRepoMock.Setup(r => r.GetAggregateByEntrepreneurIdAsync(entrepreneurId, default))
            .ReturnsAsync((4.5d, 10));
        _absRepoMock.Setup(r => r.GetByEntrepreneurIdAsync(entrepreneurId, default))
            .ReturnsAsync(permits);

        var handler = new GetSellerDashboardEnhancedQueryHandler(
            _productRepoMock.Object, _orderRepoMock.Object, _reviewRepoMock.Object, _absRepoMock.Object);

        var result = await handler.Handle(new GetSellerDashboardEnhancedQuery(entrepreneurId), default);

        result.Should().NotBeNull();
        result.TotalProducts.Should().Be(1);
        result.LowStockProducts.Should().HaveCount(1);
        result.OrdersPendingShipment.Should().Be(0); // Status is "Pending" not Paid
        result.AbsPermitsExpiringIn90Days.Should().Be(1);
    }
}
