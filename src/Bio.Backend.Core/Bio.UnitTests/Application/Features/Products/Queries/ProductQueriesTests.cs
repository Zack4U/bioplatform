using Bio.Application.DTOs;
using Bio.Application.Features.Products.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Products.Queries;

public class ProductQueriesTests
{
    private readonly Mock<IProductRepository> _repoMock = new();
    private readonly Mock<ICacheService> _cacheMock = new();

    private Product CreateSampleProduct(Guid id, string name = "Test Product", string slug = "test-product")
    {
        return new Product(Guid.NewGuid(), Guid.NewGuid(), name, slug, "Desc", 100, 150, 10, null, null, null, null);
    }

    [Fact]
    public async Task GetPublicProducts_ShouldReturnPaginatedList()
    {
        var q = new GetPublicProductsQuery { Page = 1, PageSize = 10 };
        var products = new List<Product> { CreateSampleProduct(Guid.NewGuid()) };

        _cacheMock.Setup(c => c.GetAsync<PaginatedResult<ProductListItemDTO>>(It.IsAny<string>(), default))
            .ReturnsAsync((PaginatedResult<ProductListItemDTO>?)null);

        _repoMock.Setup(r => r.GetPublicFilteredAsync(It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<Guid?>(),
            It.IsAny<decimal?>(), It.IsAny<decimal?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), default))
            .ReturnsAsync((products, 1));

        var handler = new GetPublicProductsQueryHandler(_repoMock.Object, _cacheMock.Object);

        var result = await handler.Handle(q, default);

        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetManagedProducts_ShouldReturnPaginatedList()
    {
        var q = new GetManagedProductsQuery { Page = 1, PageSize = 10 };
        var products = new List<Product> { CreateSampleProduct(Guid.NewGuid()) };

        _repoMock.Setup(r => r.GetManagedFilteredAsync(It.IsAny<Guid?>(), It.IsAny<bool?>(), It.IsAny<string>(), It.IsAny<int?>(),
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), default, It.IsAny<bool?>()))
            .ReturnsAsync((products, 1));

        var handler = new GetManagedProductsQueryHandler(_repoMock.Object);

        var result = await handler.Handle(q, default);

        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetProductById_WhenFound_ShouldReturnDetailDto()
    {
        var id = Guid.NewGuid();
        var product = CreateSampleProduct(id);

        _cacheMock.Setup(c => c.GetAsync<ProductDetailDTO>(It.IsAny<string>(), default))
            .ReturnsAsync((ProductDetailDTO?)null);
        _repoMock.Setup(r => r.GetByIdWithDetailsAsync(id, default)).ReturnsAsync(product);

        var handler = new GetProductByIdQueryHandler(_repoMock.Object, _cacheMock.Object);

        var result = await handler.Handle(new GetProductByIdQuery(id), default);

        result.Should().NotBeNull();
        result.Name.Should().Be("Test Product");
    }

    [Fact]
    public async Task GetProductById_WhenNotFound_ShouldThrowNotFoundException()
    {
        _cacheMock.Setup(c => c.GetAsync<ProductDetailDTO>(It.IsAny<string>(), default))
            .ReturnsAsync((ProductDetailDTO?)null);
        _repoMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<Guid>(), default)).ReturnsAsync((Product?)null);

        var handler = new GetProductByIdQueryHandler(_repoMock.Object, _cacheMock.Object);

        await FluentActions.Awaiting(() => handler.Handle(new GetProductByIdQuery(Guid.NewGuid()), default))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetProductBySlug_WhenFound_ShouldReturnDetailDto()
    {
        var product = CreateSampleProduct(Guid.NewGuid(), slug: "my-slug");

        _cacheMock.Setup(c => c.GetAsync<ProductDetailDTO>(It.IsAny<string>(), default))
            .ReturnsAsync((ProductDetailDTO?)null);
        _repoMock.Setup(r => r.GetBySlugWithDetailsAsync("my-slug", default)).ReturnsAsync(product);

        var handler = new GetProductBySlugQueryHandler(_repoMock.Object, _cacheMock.Object);

        var result = await handler.Handle(new GetProductBySlugQuery("my-slug"), default);

        result.Should().NotBeNull();
        result.Slug.Should().Be("my-slug");
    }

    [Fact]
    public async Task GetProductFilterMeta_ShouldReturnMeta()
    {
        _cacheMock.Setup(c => c.GetAsync<ProductFilterMetaDTO>(It.IsAny<string>(), default))
            .ReturnsAsync((ProductFilterMetaDTO?)null);

        var cats = new List<ProductCategory> { new ProductCategory("Cat") };
        _repoMock.Setup(r => r.GetFilterMetaAsync(default)).ReturnsAsync((cats, 10m, 100m, 5));

        var handler = new GetProductFilterMetaQueryHandler(_repoMock.Object, _cacheMock.Object);

        var result = await handler.Handle(new GetProductFilterMetaQuery(), default);

        result.Should().NotBeNull();
        result.MinPrice.Should().Be(10m);
        result.TotalProducts.Should().Be(5);
    }

    [Fact]
    public async Task GetRelatedProducts_ShouldReturnList()
    {
        var id = Guid.NewGuid();
        var source = CreateSampleProduct(id);
        var related = new List<Product> { CreateSampleProduct(Guid.NewGuid(), "Related") };

        _cacheMock.Setup(c => c.GetAsync<IReadOnlyList<ProductListItemDTO>>(It.IsAny<string>(), default))
            .ReturnsAsync((IReadOnlyList<ProductListItemDTO>?)null);

        _repoMock.Setup(r => r.GetByIdAsync(id, default)).ReturnsAsync(source);
        _repoMock.Setup(r => r.GetRelatedAsync(id, It.IsAny<int?>(), It.IsAny<Guid>(), It.IsAny<int>(), default))
            .ReturnsAsync(related);

        var handler = new GetRelatedProductsQueryHandler(_repoMock.Object, _cacheMock.Object);

        var result = await handler.Handle(new GetRelatedProductsQuery(id), default);

        result.Should().NotBeNull();
        result.Should().HaveCount(1);
    }
}
