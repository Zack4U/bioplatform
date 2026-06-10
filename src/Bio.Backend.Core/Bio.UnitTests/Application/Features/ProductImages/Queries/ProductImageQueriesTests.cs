using Bio.Application.Features.ProductImages.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.ProductImages.Queries;

public class ProductImageQueriesTests
{
    private readonly Mock<IProductImageRepository> _repoMock = new();

    [Fact]
    public async Task GetProductImages_ShouldReturnList()
    {
        var productId = Guid.NewGuid();
        var images = new List<ProductImage> { new(productId, "url", "alt", 0, true) };

        _repoMock.Setup(r => r.GetByProductIdAsync(productId, default)).ReturnsAsync(images);

        var handler = new GetProductImagesQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetProductImagesQuery(productId), default);

        result.Should().HaveCount(1);
        result[0].ImageUrl.Should().Be("url");
        result[0].IsPrimary.Should().BeTrue();
    }
}
