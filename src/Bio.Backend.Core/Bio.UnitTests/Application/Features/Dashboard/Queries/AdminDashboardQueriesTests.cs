using Bio.Application.DTOs;
using Bio.Application.Features.Dashboard.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
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
    private readonly GetAdminDashboardQueryHandler _handler;

    public AdminDashboardQueriesTests()
    {
        _handler = new GetAdminDashboardQueryHandler(
            _userRepoMock.Object, _productRepoMock.Object, _orderRepoMock.Object,
            _absRepoMock.Object, _certRepoMock.Object, _postRepoMock.Object,
            _connRepoMock.Object, _commentRepoMock.Object);
    }

    [Fact]
    public async Task Handle_ReturnsValidAdminDashboardDTO()
    {
        // Arrange
        var query = new GetAdminDashboardQuery();
        var ct = CancellationToken.None;

        var users = new List<User> { new User(Guid.NewGuid(), "Test User", "test@bio.com", "hash", "salt", null) };
        _userRepoMock.Setup(x => x.GetAllAsync()).ReturnsAsync(users);
        _userRepoMock.Setup(x => x.GetCountByRoleAsync(ct)).ReturnsAsync(new List<(string, int)> { ("Admin", 1) });

        var products = new List<Product>();
        _productRepoMock.Setup(x => x.GetManagedFilteredAsync(It.IsAny<Guid?>(), It.IsAny<bool?>(), It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>(), 1, 10000, ct))
            .ReturnsAsync((products, 0));

        var orders = new List<Order>();
        _orderRepoMock.Setup(x => x.GetManagedAsync(It.IsAny<string?>(), 1, 10000, ct))
            .ReturnsAsync((orders, 0));

        var permits = new List<AbsPermit>();
        _absRepoMock.Setup(x => x.GetAllPagedAsync(It.IsAny<Guid?>(), It.IsAny<string?>(), 1, 10000, ct))
            .ReturnsAsync((permits, 0));

        var posts = new List<CommunityPost>();
        _postRepoMock.Setup(x => x.GetPagedAsync(It.IsAny<string?>(), It.IsAny<string?>(), 1, 10000, ct))
            .ReturnsAsync((posts, 0));

        // Act
        var result = await _handler.Handle(query, ct);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Users.TotalUsers);
        Assert.Empty(result.TopEntrepreneurs);
    }
}
