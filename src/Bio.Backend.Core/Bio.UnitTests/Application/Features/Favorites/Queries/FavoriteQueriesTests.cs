using Bio.Application.DTOs;
using Bio.Application.Features.Favorites.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Favorites.Queries;

public class FavoriteQueriesTests
{
    private readonly Mock<IFavoriteRepository> _repoMock = new();
    private readonly Mock<IProductRepository> _productRepoMock = new();

    [Fact]
    public async Task GetMyFavorites_ShouldReturnPaginatedList()
    {
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var favorites = new List<Favorite> { new(userId, "PRODUCT", productId) };
        var product = new Product(Guid.NewGuid(), Guid.NewGuid(), "Sample Product", "sample-product", "Desc", 100, 150, 10, null, null, null, null);
        typeof(Product).GetProperty("Id")!.SetValue(product, productId);

        _repoMock.Setup(r => r.GetByUserIdAsync(userId, "PRODUCT", 1, 10, default)).ReturnsAsync((favorites, 1));
        _productRepoMock.Setup(r => r.GetByIdsAsync(It.IsAny<IEnumerable<Guid>>(), default)).ReturnsAsync(new List<Product> { product });

        var handler = new GetMyFavoritesQueryHandler(_repoMock.Object, _productRepoMock.Object);
        var result = await handler.Handle(new GetMyFavoritesQuery(userId, "PRODUCT"), default);

        result.Items.Should().HaveCount(1);
        result.TotalCount.Should().Be(1);
    }
}
