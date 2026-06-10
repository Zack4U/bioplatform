using Bio.Application.DTOs;
using Bio.Application.Features.ProductCategories.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.ProductCategories.Commands;

public class ProductCategoryCommandsTests
{
    private readonly Mock<IProductCategoryRepository> _repoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    [Fact]
    public async Task CreateCategory_ShouldCreate()
    {
        var handler = new CreateProductCategoryCommandHandler(_repoMock.Object, _uowMock.Object);
        var dto = new ProductCategoryCreateDTO("Cat");

        _repoMock.Setup(r => r.ExistsByNameAsync("Cat", default)).ReturnsAsync(false);

        var result = await handler.Handle(new CreateProductCategoryCommand(dto), default);

        result.Name.Should().Be("Cat");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdateCategory_ShouldUpdate()
    {
        var handler = new UpdateProductCategoryCommandHandler(_repoMock.Object, _uowMock.Object);
        var dto = new ProductCategoryUpdateDTO("Cat2");
        var cat = new ProductCategory("Cat");

        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<int>(), default)).ReturnsAsync(cat);
        _repoMock.Setup(r => r.ExistsByNameExcludingIdAsync("Cat2", 1, default)).ReturnsAsync(false);

        var result = await handler.Handle(new UpdateProductCategoryCommand(1, dto), default);

        result.Name.Should().Be("Cat2");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeleteCategory_ShouldDelete()
    {
        var handler = new DeleteProductCategoryCommandHandler(_repoMock.Object, _uowMock.Object);
        var cat = new ProductCategory("Cat");

        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<int>(), default)).ReturnsAsync(cat);

        await handler.Handle(new DeleteProductCategoryCommand(1), default);

        _repoMock.Verify(r => r.DeleteAsync(cat, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
