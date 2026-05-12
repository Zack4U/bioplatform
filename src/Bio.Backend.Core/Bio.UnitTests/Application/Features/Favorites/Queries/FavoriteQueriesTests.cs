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

    [Fact]
    public async Task GetMyFavorites_ShouldReturnPaginatedList()
    {
        var userId = Guid.NewGuid();
        var favorites = new List<Favorite> { new(userId, "PRODUCT", Guid.NewGuid()) };

        _repoMock.Setup(r => r.GetByUserIdAsync(userId, null, 1, 10, default)).ReturnsAsync((favorites, 1));

        var handler = new GetMyFavoritesQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetMyFavoritesQuery(userId), default);

        result.Items.Should().HaveCount(1);
        result.TotalCount.Should().Be(1);
    }
}
