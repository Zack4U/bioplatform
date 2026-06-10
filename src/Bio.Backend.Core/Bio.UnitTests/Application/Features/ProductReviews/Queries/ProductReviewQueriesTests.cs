using Bio.Application.DTOs;
using Bio.Application.Features.ProductReviews.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.ProductReviews.Queries;

public class ProductReviewQueriesTests
{
    private readonly Mock<IProductReviewRepository> _repoMock = new();

    [Fact]
    public async Task GetProductReviews_ShouldReturnPaginatedList()
    {
        var handler = new GetProductReviewsQueryHandler(_repoMock.Object);
        var pid = Guid.NewGuid();
        var reviews = new List<ProductReview> { new(pid, Guid.NewGuid(), 5, "Title", "Comment") };

        _repoMock.Setup(r => r.GetByProductIdAsync(pid, 1, 10, default)).ReturnsAsync((reviews, 1));

        var result = await handler.Handle(new GetProductReviewsQuery(pid), default);

        result.Items.Should().HaveCount(1);
        result.TotalCount.Should().Be(1);
        result.Items[0].Rating.Should().Be(5);
    }

    [Fact]
    public async Task GetMyReviews_ShouldReturnPaginatedList()
    {
        var handler = new GetMyReviewsQueryHandler(_repoMock.Object);
        var uid = Guid.NewGuid();
        var reviews = new List<ProductReview> { new(Guid.NewGuid(), uid, 4, "T", "C") };

        _repoMock.Setup(r => r.GetByUserIdAsync(uid, 1, 10, default)).ReturnsAsync((reviews, 1));

        var result = await handler.Handle(new GetMyReviewsQuery(uid), default);

        result.Items.Should().HaveCount(1);
        result.TotalCount.Should().Be(1);
        result.Items[0].Rating.Should().Be(4);
    }
}
