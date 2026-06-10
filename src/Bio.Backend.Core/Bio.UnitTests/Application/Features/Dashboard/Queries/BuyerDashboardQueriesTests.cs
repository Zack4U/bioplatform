using Bio.Application.DTOs;
using Bio.Application.Features.Dashboard.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Dashboard.Queries;

public class BuyerDashboardQueriesTests
{
    private readonly Mock<IOrderRepository> _orderRepoMock = new();
    private readonly Mock<IFavoriteRepository> _favoriteRepoMock = new();
    private readonly Mock<IProductReviewRepository> _reviewRepoMock = new();

    [Fact]
    public async Task GetBuyerDashboard_ShouldReturnMetrics()
    {
        var buyerId = Guid.NewGuid();
        var order = new Order(buyerId, "ORD123", 100m, 100m, "Card");
        var orders = new List<Order> { order };
        var favProduct = new Favorite(buyerId, "Product", Guid.NewGuid());
        var favProducts = new List<Favorite> { favProduct };
        var review = new ProductReview(Guid.NewGuid(), buyerId, 5, "Title", "Great");
        var reviews = new List<ProductReview> { review };

        _orderRepoMock.Setup(r => r.GetByBuyerIdAsync(buyerId, 1, 10000, default))
            .ReturnsAsync((orders, 1));
        _favoriteRepoMock.Setup(r => r.GetByUserIdAsync(buyerId, "Product", 1, 10000, default))
            .ReturnsAsync((favProducts, 1));
        _favoriteRepoMock.Setup(r => r.GetByUserIdAsync(buyerId, "Species", 1, 10000, default))
            .ReturnsAsync((new List<Favorite>(), 0));
        _reviewRepoMock.Setup(r => r.GetByUserIdAsync(buyerId, 1, 10000, default))
            .ReturnsAsync((reviews, 1));

        var handler = new GetBuyerDashboardQueryHandler(_orderRepoMock.Object, _favoriteRepoMock.Object, _reviewRepoMock.Object);

        var result = await handler.Handle(new GetBuyerDashboardQuery(buyerId), default);

        result.Should().NotBeNull();
        result.TotalOrders.Should().Be(1);
        result.TotalSpent.Should().Be(100m);
        result.FavoriteProductsCount.Should().Be(1);
        result.FavoriteSpeciesCount.Should().Be(0);
        result.ReviewsWritten.Should().Be(1);
        result.LastOrder.Should().NotBeNull();
        result.LastOrder!.OrderNumber.Should().Be("ORD123");
    }
}
