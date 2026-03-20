using AutoMapper;
using Bio.Application.DTOs;
using Bio.Application.Features.Products.Commands.CreateProduct;
using Bio.Application.Features.Products.Commands.DeleteProduct;
using Bio.Application.Features.Products.Commands.UpdateProduct;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using MediatR;

namespace Bio.UnitTests.Application.Features.Products;

public class ProductCommandHandlersTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;

    public ProductCommandHandlersTests()
    {
        _uowMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
    }

    [Fact]
    public async Task CreateProduct_ShouldSucceed_WhenValid()
    {
        // Arrange
        var dto = new ProductCreateDTO
        {
            Name = "Test Product",
            Slug = "test-product",
            Price = 100,
            StockQuantity = 10,
            EntrepreneurId = Guid.NewGuid(),
            BaseSpeciesId = Guid.NewGuid()
        };
        var command = new CreateProductCommand(dto);

        _uowMock.Setup(m => m.Products.GetBySlugAsync(dto.Slug, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product)null!);

        _uowMock.Setup(m => m.Products.AddAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = new CreateProductCommandHandler(_uowMock.Object, _mapperMock.Object);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        _uowMock.Verify(m => m.Products.AddAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(m => m.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateProduct_ShouldThrowConflictException_WhenSlugExists()
    {
        // Arrange
        var dto = new ProductCreateDTO { Slug = "existing-slug" };
        var command = new CreateProductCommand(dto);
        var existingProduct = new Mock<Product>(); // Minimal mock of product

        _uowMock.Setup(m => m.Products.GetBySlugAsync(dto.Slug, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Product(id: Guid.NewGuid(), entrepreneurId: Guid.NewGuid(), baseSpeciesId: Guid.NewGuid(), categoryId: null, slug: "slug", name: "name", description: "desc", price: 10.0m, stockQuantity: 1, sku: null, thumbnailUrl: null));

        var handler = new CreateProductCommandHandler(_uowMock.Object, _mapperMock.Object);

        // Act & Assert
        await handler.Invoking(h => h.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task UpdateProduct_ShouldSucceed_WhenValid()
    {
        // Arrange
        var productId = Guid.NewGuid();
        var product = new Product(id: productId, entrepreneurId: Guid.NewGuid(), baseSpeciesId: Guid.NewGuid(), categoryId: null, slug: "slug", name: "Old Name", description: "desc", price: 10.0m, stockQuantity: 1, sku: null, thumbnailUrl: null);
        var dto = new ProductUpdateDTO { Name = "New Name", Price = 20, StockQuantity = 5 };
        var command = new UpdateProductCommand(productId, dto);

        _uowMock.Setup(m => m.Products.GetByIdAsync(productId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        var handler = new UpdateProductCommandHandler(_uowMock.Object, _mapperMock.Object);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        product.Name.Should().Be("New Name");
        _uowMock.Verify(m => m.Products.Update(product), Times.Once);
        _uowMock.Verify(m => m.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteProduct_ShouldSucceed_WhenExists()
    {
        // Arrange
        var productId = Guid.NewGuid();
        var product = new Product(id: productId, entrepreneurId: Guid.NewGuid(), baseSpeciesId: Guid.NewGuid(), categoryId: null, slug: "slug", name: "name", description: "desc", price: 10.0m, stockQuantity: 1, sku: null, thumbnailUrl: null);
        var command = new DeleteProductCommand(productId);

        _uowMock.Setup(m => m.Products.GetByIdAsync(productId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        var handler = new DeleteProductCommandHandler(_uowMock.Object);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        _uowMock.Verify(m => m.Products.Delete(product), Times.Once);
        _uowMock.Verify(m => m.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
