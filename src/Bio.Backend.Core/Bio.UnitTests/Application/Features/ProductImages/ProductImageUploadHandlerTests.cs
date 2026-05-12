using Bio.Application.DTOs;
using Bio.Application.Features.ProductImages.Commands;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Bio.UnitTests.Application.Features.ProductImages;

/// <summary>
/// Unit tests for product image upload/delete handlers.
/// Verifies correct S3 path construction, ownership checks, and S3 cleanup on delete.
/// </summary>
public class ProductImageUploadHandlerTests
{
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<IProductImageRepository> _imageRepo = new();
    private readonly Mock<IS3StorageService> _s3 = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private static readonly Guid EntrepreneurId = Guid.NewGuid();
    private static readonly Guid OtherUserId = Guid.NewGuid();
    private static readonly Guid ProductId = Guid.NewGuid();

    private static Product MakeProduct(Guid? entrepreneurId = null) =>
        new(entrepreneurId ?? EntrepreneurId, Guid.NewGuid(), "Test Product", "test-product", "Desc", 10, 15, 10);

    private static Stream MakeFakeStream(int lengthBytes = 1024)
    {
        var data = new byte[lengthBytes];
        new Random().NextBytes(data);
        return new MemoryStream(data);
    }

    // ── AddProductImageCommand Tests ───────────────────────────────────────────

    [Fact]
    public async Task Upload_ValidCommand_UploadsToCorrectS3Path()
    {
        // Arrange
        var product = MakeProduct();
        _productRepo.Setup(r => r.GetByIdAsync(product.Id, default)).ReturnsAsync(product);

        string? capturedKey = null;
        _s3.Setup(s => s.UploadImageAsync(It.IsAny<Stream>(), It.IsAny<string>(),
                It.IsAny<string>(), default))
            .Callback<Stream, string, string, CancellationToken>((_, key, _, _) => capturedKey = key)
            .ReturnsAsync("https://bucket.s3.amazonaws.com/assets/images/products/test/img.jpg");
        _uow.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new AddProductImageCommand
        {
            ProductId = product.Id,
            FileStream = MakeFakeStream(),
            ContentType = "image/jpeg",
            OriginalFileName = "photo.jpg",
            ActorId = EntrepreneurId,
            ActorRole = "ENTREPRENEUR",
            AltText = "Product front view",
            DisplayOrder = 0,
            IsPrimary = true,
        };

        var handler = new AddProductImageCommandHandler(
            _productRepo.Object, _imageRepo.Object, _s3.Object, _uow.Object);

        // Act
        var result = await handler.Handle(command, default);

        // Assert
        result.Should().NotBeNull();
        result.ImageUrl.Should().NotBeNullOrEmpty();
        result.AltText.Should().Be("Product front view");
        result.IsPrimary.Should().BeTrue();

        capturedKey.Should().NotBeNull();
        capturedKey.Should().StartWith($"{ObservationConstants.S3ProductImagesBasePath}/{EntrepreneurId}/product_");
        capturedKey.Should().EndWith(".jpg");

        _imageRepo.Verify(r => r.ClearPrimaryForProductAsync(product.Id, default), Times.Once);
        _s3.Verify(s => s.UploadImageAsync(It.IsAny<Stream>(),
            It.Is<string>(k => k.StartsWith($"assets/images/products/{EntrepreneurId}/product_")),
            "image/jpeg", default), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task Upload_PngFile_UsesCorrectExtension()
    {
        // Arrange
        var product = MakeProduct();
        _productRepo.Setup(r => r.GetByIdAsync(product.Id, default)).ReturnsAsync(product);

        string? capturedKey = null;
        _s3.Setup(s => s.UploadImageAsync(It.IsAny<Stream>(), It.IsAny<string>(),
                It.IsAny<string>(), default))
            .Callback<Stream, string, string, CancellationToken>((_, key, _, _) => capturedKey = key)
            .ReturnsAsync("https://bucket.s3.amazonaws.com/img.png");
        _uow.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new AddProductImageCommand
        {
            ProductId = product.Id,
            FileStream = MakeFakeStream(),
            ContentType = "image/png",
            OriginalFileName = "photo.png",
            ActorId = EntrepreneurId,
            ActorRole = "ENTREPRENEUR",
        };

        var handler = new AddProductImageCommandHandler(
            _productRepo.Object, _imageRepo.Object, _s3.Object, _uow.Object);

        // Act
        await handler.Handle(command, default);

        // Assert
        capturedKey.Should().EndWith(".png");
    }

    [Fact]
    public async Task Upload_NonOwner_ThrowsForbidden()
    {
        // Arrange
        var product = MakeProduct(EntrepreneurId);
        _productRepo.Setup(r => r.GetByIdAsync(product.Id, default)).ReturnsAsync(product);

        var command = new AddProductImageCommand
        {
            ProductId = product.Id,
            FileStream = MakeFakeStream(),
            ContentType = "image/jpeg",
            OriginalFileName = "photo.jpg",
            ActorId = OtherUserId,
            ActorRole = "ENTREPRENEUR",
        };

        var handler = new AddProductImageCommandHandler(
            _productRepo.Object, _imageRepo.Object, _s3.Object, _uow.Object);

        // Act & Assert
        await FluentActions.Awaiting(() => handler.Handle(command, default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Upload_AdminRole_BypassesOwnershipCheck()
    {
        // Arrange
        var product = MakeProduct(EntrepreneurId);
        _productRepo.Setup(r => r.GetByIdAsync(product.Id, default)).ReturnsAsync(product);

        _s3.Setup(s => s.UploadImageAsync(It.IsAny<Stream>(), It.IsAny<string>(),
                It.IsAny<string>(), default))
            .ReturnsAsync("https://bucket.s3.amazonaws.com/img.jpg");
        _uow.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new AddProductImageCommand
        {
            ProductId = product.Id,
            FileStream = MakeFakeStream(),
            ContentType = "image/jpeg",
            OriginalFileName = "photo.jpg",
            ActorId = OtherUserId,
            ActorRole = "ADMIN",
        };

        var handler = new AddProductImageCommandHandler(
            _productRepo.Object, _imageRepo.Object, _s3.Object, _uow.Object);

        // Act
        var result = await handler.Handle(command, default);

        // Assert — should succeed even though ActorId != EntrepreneurId
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task Upload_ProductNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _productRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((Product?)null);

        var command = new AddProductImageCommand
        {
            ProductId = Guid.NewGuid(),
            FileStream = MakeFakeStream(),
            ContentType = "image/jpeg",
            OriginalFileName = "photo.jpg",
            ActorId = EntrepreneurId,
            ActorRole = "ENTREPRENEUR",
        };

        var handler = new AddProductImageCommandHandler(
            _productRepo.Object, _imageRepo.Object, _s3.Object, _uow.Object);

        // Act & Assert
        await FluentActions.Awaiting(() => handler.Handle(command, default))
            .Should().ThrowAsync<NotFoundException>();
    }

    // ── DeleteProductImageCommand Tests ─────────────────────────────────────────

    [Fact]
    public async Task Delete_ValidCommand_DeletesFromS3AndDb()
    {
        // Arrange
        var product = MakeProduct();
        var imageUrl = "https://bucket.s3.amazonaws.com/assets/images/products/test/img.jpg";
        var image = new ProductImage(product.Id, imageUrl, "Alt", 0, false);

        _imageRepo.Setup(r => r.GetByIdAsync(image.Id, default)).ReturnsAsync(image);
        _productRepo.Setup(r => r.GetByIdAsync(product.Id, default)).ReturnsAsync(product);
        _s3.Setup(s => s.ExtractObjectKey(imageUrl)).Returns("assets/images/products/test/img.jpg");
        _uow.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var handler = new DeleteProductImageCommandHandler(
            _productRepo.Object, _imageRepo.Object, _s3.Object, _uow.Object);

        // Act
        await handler.Handle(new DeleteProductImageCommand(image.Id, EntrepreneurId, "ENTREPRENEUR"), default);

        // Assert
        _s3.Verify(s => s.DeleteObjectAsync("assets/images/products/test/img.jpg", default), Times.Once);
        _imageRepo.Verify(r => r.DeleteAsync(image, default), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task Delete_NonOwner_ThrowsForbidden()
    {
        // Arrange
        var product = MakeProduct(EntrepreneurId);
        var image = new ProductImage(product.Id, "https://bucket.s3.amazonaws.com/img.jpg", null, 0, false);

        _imageRepo.Setup(r => r.GetByIdAsync(image.Id, default)).ReturnsAsync(image);
        _productRepo.Setup(r => r.GetByIdAsync(product.Id, default)).ReturnsAsync(product);

        var handler = new DeleteProductImageCommandHandler(
            _productRepo.Object, _imageRepo.Object, _s3.Object, _uow.Object);

        // Act & Assert
        await FluentActions.Awaiting(() =>
            handler.Handle(new DeleteProductImageCommand(image.Id, OtherUserId, "ENTREPRENEUR"), default))
            .Should().ThrowAsync<ForbiddenException>();

        _s3.Verify(s => s.DeleteObjectAsync(It.IsAny<string>(), default), Times.Never);
    }
}
