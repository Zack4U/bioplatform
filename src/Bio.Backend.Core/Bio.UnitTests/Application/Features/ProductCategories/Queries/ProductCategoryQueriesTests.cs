using Bio.Application.DTOs;
using Bio.Application.Features.ProductCategories.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.ProductCategories.Queries;

public class ProductCategoryQueriesTests
{
    private readonly Mock<IProductCategoryRepository> _repoMock = new();

    [Fact]
    public async Task GetAllCategories_ShouldReturnList()
    {
        var cats = new List<ProductCategory> { new("Cat") };
        _repoMock.Setup(r => r.GetAllAsync(default)).ReturnsAsync(cats);

        var handler = new GetAllProductCategoriesQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetAllProductCategoriesQuery(), default);

        result.Should().HaveCount(1);
    }
}
