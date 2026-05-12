using Bio.Application.Features.ProductImages.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.ProductImages.Commands;

public class ProductImageCommandsTests
{
    private readonly Mock<IProductRepository> _productRepoMock = new();
    private readonly Mock<IProductImageRepository> _imageRepoMock = new();
    private readonly Mock<IS3StorageService> _s3Mock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    private Product CreateProduct(Guid id, Guid entrepreneurId)
    {
        return new Product(entrepreneurId, Guid.NewGuid(), "P", "p", "D", 10, 10, 10, null, null, null, null);
    }

    [Fact]
    public async Task AddProductImage_WhenValid_ShouldUploadAndCreate()
    {
        var productId = Guid.NewGuid();
        var entrepreneurId = Guid.NewGuid();
        var product = CreateProduct(productId, entrepreneurId);

        _productRepoMock.Setup(r => r.GetByIdAsync(productId, default)).ReturnsAsync(product);
        _s3Mock.Setup(s => s.UploadImageAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), default))
            .ReturnsAsync("https://s3.url/image.jpg");

        var handler = new AddProductImageCommandHandler(_productRepoMock.Object, _imageRepoMock.Object, _s3Mock.Object, _uowMock.Object);
        var cmd = new AddProductImageCommand 
        { 
            ProductId = productId, ActorId = entrepreneurId, ActorRole = "ENTREPRENEUR", 
            FileStream = new MemoryStream(), ContentType = "image/jpeg", IsPrimary = true 
        };

        var result = await handler.Handle(cmd, default);

        result.ImageUrl.Should().Be("https://s3.url/image.jpg");
        result.IsPrimary.Should().BeTrue();
        _imageRepoMock.Verify(r => r.ClearPrimaryForProductAsync(productId, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task AddProductImage_WhenNotOwner_ShouldThrowForbidden()
    {
        var productId = Guid.NewGuid();
        var product = CreateProduct(productId, Guid.NewGuid()); // different owner

        _productRepoMock.Setup(r => r.GetByIdAsync(productId, default)).ReturnsAsync(product);
        var handler = new AddProductImageCommandHandler(_productRepoMock.Object, _imageRepoMock.Object, _s3Mock.Object, _uowMock.Object);
        var cmd = new AddProductImageCommand { ProductId = productId, ActorId = Guid.NewGuid(), ActorRole = "ENTREPRENEUR" };

        await FluentActions.Awaiting(() => handler.Handle(cmd, default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task DeleteProductImage_WhenValid_ShouldDeleteFromS3AndDb()
    {
        var imageId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var entrepreneurId = Guid.NewGuid();
        var image = new ProductImage(productId, "url", null, 0, false);
        var product = CreateProduct(productId, entrepreneurId);

        _imageRepoMock.Setup(r => r.GetByIdAsync(imageId, default)).ReturnsAsync(image);
        _productRepoMock.Setup(r => r.GetByIdAsync(productId, default)).ReturnsAsync(product);
        _s3Mock.Setup(s => s.ExtractObjectKey("url")).Returns("key");

        var handler = new DeleteProductImageCommandHandler(_productRepoMock.Object, _imageRepoMock.Object, _s3Mock.Object, _uowMock.Object);
        var cmd = new DeleteProductImageCommand(imageId, entrepreneurId, "ENTREPRENEUR");

        await handler.Handle(cmd, default);

        _s3Mock.Verify(s => s.DeleteObjectAsync("key", default), Times.Once);
        _imageRepoMock.Verify(r => r.DeleteAsync(image, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task SetPrimaryProductImage_ShouldClearOthersAndSet()
    {
        var imageId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var entrepreneurId = Guid.NewGuid();
        var image = new ProductImage(productId, "url", null, 0, false);
        var product = CreateProduct(productId, entrepreneurId);

        _imageRepoMock.Setup(r => r.GetByIdAsync(imageId, default)).ReturnsAsync(image);
        _productRepoMock.Setup(r => r.GetByIdAsync(productId, default)).ReturnsAsync(product);

        var handler = new SetPrimaryProductImageCommandHandler(_productRepoMock.Object, _imageRepoMock.Object, _uowMock.Object);
        var cmd = new SetPrimaryProductImageCommand(imageId, entrepreneurId, "ENTREPRENEUR");

        await handler.Handle(cmd, default);

        image.IsPrimary.Should().BeTrue();
        _imageRepoMock.Verify(r => r.ClearPrimaryForProductAsync(productId, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
