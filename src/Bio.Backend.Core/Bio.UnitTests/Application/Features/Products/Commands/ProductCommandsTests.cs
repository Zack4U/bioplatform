using Bio.Application.DTOs;
using Bio.Application.Features.Products.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Products.Commands;

public class ProductCommandsTests
{
    private readonly Mock<IProductRepository> _repoMock = new();
    private readonly Mock<IAbsPermitRepository> _absRepoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();
    private readonly Mock<ICacheService> _cacheMock = new();

    private Product CreateSampleProduct(Guid id, Guid entrepreneurId)
    {
        return new Product(entrepreneurId, Guid.NewGuid(), "Test", "test", "Desc", 100, 150, 10, null, null, null, null);
    }

    [Fact]
    public async Task CreateProduct_WhenValidPermit_ShouldCreate()
    {
        var entrepreneurId = Guid.NewGuid();
        var speciesId = Guid.NewGuid();
        var dto = new ProductCreateDTO { Name = "New", Slug = "new", BaseSpeciesId = speciesId, BasePrice = 10, SellPrice = 20 };
        var permit = new AbsPermit(entrepreneurId, speciesId, "RES-1", DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(10), "Auth");

        _absRepoMock.Setup(r => r.GetActiveByEntrepreneurAndSpeciesAsync(entrepreneurId, speciesId, default)).ReturnsAsync(permit);
        _repoMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<Guid>(), default)).ReturnsAsync(CreateSampleProduct(Guid.NewGuid(), entrepreneurId));
        _uowMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var handler = new CreateProductCommandHandler(_repoMock.Object, _absRepoMock.Object, _uowMock.Object);
        var cmd = new CreateProductCommand(dto, entrepreneurId);

        var result = await handler.Handle(cmd, default);

        result.Should().NotBeNull();
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task CreateProduct_WhenNoValidPermit_ShouldThrowForbidden()
    {
        var entrepreneurId = Guid.NewGuid();
        var speciesId = Guid.NewGuid();
        var dto = new ProductCreateDTO { BaseSpeciesId = speciesId };

        _absRepoMock.Setup(r => r.GetActiveByEntrepreneurAndSpeciesAsync(entrepreneurId, speciesId, default)).ReturnsAsync((AbsPermit?)null);

        var handler = new CreateProductCommandHandler(_repoMock.Object, _absRepoMock.Object, _uowMock.Object);
        var cmd = new CreateProductCommand(dto, entrepreneurId);

        await FluentActions.Awaiting(() => handler.Handle(cmd, default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task UpdateProduct_WhenValid_ShouldUpdateAndInvalidateCache()
    {
        var id = Guid.NewGuid();
        var entrepreneurId = Guid.NewGuid();
        var product = CreateSampleProduct(id, entrepreneurId);

        _repoMock.Setup(r => r.GetByIdWithDetailsAsync(id, default)).ReturnsAsync(product);
        _repoMock.Setup(r => r.ExistsBySlugExcludingIdAsync("new-slug", id, default)).ReturnsAsync(false);

        var handler = new UpdateProductCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);
        var dto = new ProductUpdateDTO { Name = "New Name", Slug = "new-slug", Description = "Desc", BasePrice = 200, SellPrice = 250, StockQuantity = 20 };
        var cmd = new UpdateProductCommand(id, dto, entrepreneurId, "ENTREPRENEUR");

        var result = await handler.Handle(cmd, default);

        result.Name.Should().Be("New Name");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
        _cacheMock.Verify(c => c.RemoveByPrefixAsync(It.IsAny<string>(), default), Times.Once);
    }

    [Fact]
    public async Task UpdateProduct_WhenNotOwner_ShouldThrowForbidden()
    {
        var id = Guid.NewGuid();
        var product = CreateSampleProduct(id, Guid.NewGuid());

        _repoMock.Setup(r => r.GetByIdWithDetailsAsync(id, default)).ReturnsAsync(product);
        var handler = new UpdateProductCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);
        var cmd = new UpdateProductCommand(id, new ProductUpdateDTO { Name = "N" }, Guid.NewGuid(), "BUYER");

        await FluentActions.Awaiting(() => handler.Handle(cmd, default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task DeleteProduct_WhenValid_ShouldDeactivateAndInvalidateCache()
    {
        var id = Guid.NewGuid();
        var entrepreneurId = Guid.NewGuid();
        var product = CreateSampleProduct(id, entrepreneurId);

        _repoMock.Setup(r => r.GetByIdAsync(id, default)).ReturnsAsync(product);

        var handler = new DeleteProductCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);
        var cmd = new DeleteProductCommand(id, entrepreneurId, "ENTREPRENEUR");

        await handler.Handle(cmd, default);

        product.IsActive.Should().BeFalse();
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task ActivateProduct_ShouldActivateAndInvalidateCache()
    {
        var id = Guid.NewGuid();
        var product = CreateSampleProduct(id, Guid.NewGuid());
        product.Deactivate();

        _repoMock.Setup(r => r.GetByIdAsync(id, default)).ReturnsAsync(product);

        var handler = new ActivateProductCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);

        await handler.Handle(new ActivateProductCommand(id), default);

        product.IsActive.Should().BeTrue();
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeactivateProduct_ShouldDeactivateAndInvalidateCache()
    {
        var id = Guid.NewGuid();
        var product = CreateSampleProduct(id, Guid.NewGuid());

        _repoMock.Setup(r => r.GetByIdAsync(id, default)).ReturnsAsync(product);

        var handler = new DeactivateProductCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);

        await handler.Handle(new DeactivateProductCommand(id), default);

        product.IsActive.Should().BeFalse();
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
