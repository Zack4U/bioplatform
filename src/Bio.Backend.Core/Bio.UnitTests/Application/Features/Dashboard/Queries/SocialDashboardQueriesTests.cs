using Bio.Application.DTOs;
using Bio.Application.Features.Dashboard.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Dashboard.Queries;

public class SocialDashboardQueriesTests
{
    private readonly Mock<ICommunityPostRepository> _postRepoMock = new();
    private readonly Mock<IUserConnectionRepository> _connRepoMock = new();
    private readonly Mock<IFavoriteRepository> _favoriteRepoMock = new();
    private readonly Mock<IDirectThreadRepository> _threadRepoMock = new();

    [Fact]
    public async Task GetSocialDashboard_ShouldReturnMetrics()
    {
        var userId = Guid.NewGuid();

        var post = new CommunityPost(userId, "Title", "content", "Category");
        var posts = new List<CommunityPost> { post };

        var conn = new UserConnection(userId, Guid.NewGuid(), "Hello");
        var conns = new List<UserConnection> { conn };

        var favProduct = new Favorite(userId, "Product", Guid.NewGuid());
        var favProducts = new List<Favorite> { favProduct };

        _postRepoMock.Setup(r => r.GetByAuthorIdPagedAsync(userId, 1, 1000, default))
            .ReturnsAsync((posts, 1));
        _connRepoMock.Setup(r => r.GetByUserIdAsync(userId, default))
            .ReturnsAsync(conns);
        _favoriteRepoMock.Setup(r => r.GetByUserIdAsync(userId, "Product", 1, 10000, default))
            .ReturnsAsync((favProducts, 1));
        _favoriteRepoMock.Setup(r => r.GetByUserIdAsync(userId, "Species", 1, 10000, default))
            .ReturnsAsync((new List<Favorite>(), 0));
        _threadRepoMock.Setup(r => r.GetUnreadMessageCountAsync(userId, default))
            .ReturnsAsync(5);

        var handler = new GetSocialDashboardQueryHandler(
            _postRepoMock.Object, _connRepoMock.Object, _favoriteRepoMock.Object, _threadRepoMock.Object);

        var result = await handler.Handle(new GetSocialDashboardQuery(userId), default);

        result.Should().NotBeNull();
        result.MyTotalPosts.Should().Be(1);
        result.ActiveConnections.Should().Be(0);
        result.PendingConnectionRequests.Should().Be(0);
        result.UnreadDirectMessages.Should().Be(5);
        result.FavoriteProductsCount.Should().Be(1);
        result.FavoriteSpeciesCount.Should().Be(0);
    }
}
