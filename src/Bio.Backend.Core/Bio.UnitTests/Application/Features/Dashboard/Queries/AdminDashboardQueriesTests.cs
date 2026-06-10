using Bio.Application.DTOs;
using Bio.Application.Features.Dashboard.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Bio.Domain.ReadModels;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Dashboard.Queries;

public class AdminDashboardQueriesTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IProductRepository> _productRepoMock = new();
    private readonly Mock<IOrderRepository> _orderRepoMock = new();
    private readonly Mock<IAbsPermitRepository> _absRepoMock = new();
    private readonly Mock<ICertificationRepository> _certRepoMock = new();
    private readonly Mock<ICommunityPostRepository> _postRepoMock = new();
    private readonly Mock<IUserConnectionRepository> _connRepoMock = new();
    private readonly Mock<ICommunityPostCommentRepository> _commentRepoMock = new();

    [Fact]
    public async Task GetAdminDashboard_ShouldReturnMetrics()
    {
        var entrepreneurId = Guid.NewGuid();
        var user = new User(entrepreneurId, "John", "john@example.com", "hash", "salt", null);
        var users = new List<User> { user };

        var roleDetails = new List<(string RoleName, int Count)> { ("Admin", 1) };
        IReadOnlyList<(string RoleName, int Count)> roleDetailsList = roleDetails;

        var product = new Product(entrepreneurId, Guid.NewGuid(), "Prod", "prod", "Desc", 10, 10, 10);
        var products = new List<Product> { product };

        var order = new Order(Guid.NewGuid(), "ORD1", 10m, 10m, "Card");
        var orders = new List<Order> { order };

        var permit = new AbsPermit(entrepreneurId, Guid.NewGuid(), "RES1", DateTime.UtcNow, DateTime.UtcNow.AddDays(40), "Auth");
        var permits = new List<AbsPermit> { permit };

        var post = new CommunityPost(Guid.NewGuid(), "Title", "content", "Category");
        var posts = new List<CommunityPost> { post };

        _userRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(users);
        _userRepoMock.Setup(r => r.GetCountByRoleAsync(default)).ReturnsAsync(roleDetailsList);
        _productRepoMock.Setup(r => r.GetManagedFilteredAsync(null, null, null, null, "createdAt", "desc", 1, 10000, default, null))
            .ReturnsAsync((products, 1));
        _orderRepoMock.Setup(r => r.GetManagedAsync(null, 1, 10000, default, null))
            .ReturnsAsync((orders, 1));
        _absRepoMock.Setup(r => r.GetAllPagedAsync(null, null, 1, 10000, default))
            .ReturnsAsync((permits, 1));
        _postRepoMock.Setup(r => r.GetPagedAsync(null, null, 1, 10000, default, null))
            .ReturnsAsync((posts, 1));

        var handler = new GetAdminDashboardQueryHandler(
            _userRepoMock.Object, _productRepoMock.Object, _orderRepoMock.Object, _absRepoMock.Object,
            _certRepoMock.Object, _postRepoMock.Object, _connRepoMock.Object, _commentRepoMock.Object);

        var result = await handler.Handle(new GetAdminDashboardQuery(), default);

        result.Should().NotBeNull();
        result.Users.TotalUsers.Should().Be(1);
        result.Marketplace.TotalProducts.Should().Be(1);
        result.Orders.TotalOrders.Should().Be(1);
        result.Compliance.TotalAbsPermits.Should().Be(1);
        result.Community.TotalPosts.Should().Be(1);
    }
}
