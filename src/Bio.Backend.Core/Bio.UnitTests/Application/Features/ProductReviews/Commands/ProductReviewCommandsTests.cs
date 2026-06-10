using Bio.Application.DTOs;
using Bio.Application.Features.ProductReviews.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.ProductReviews.Commands;

public class ProductReviewCommandsTests
{
    private readonly Mock<IProductReviewRepository> _repoMock = new();
    private readonly Mock<IProductRepository> _productRepoMock = new();
    private readonly Mock<IOrderRepository> _orderRepoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    [Fact]
    public async Task CreateProductReview_WhenValid_ShouldCreate()
    {
        var handler = new CreateProductReviewCommandHandler(_repoMock.Object, _productRepoMock.Object, _orderRepoMock.Object, _uowMock.Object);
        var pid = Guid.NewGuid();
        var uid = Guid.NewGuid();
        var dto = new ProductReviewCreateDTO(5, "Great", "Excellent");

        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(new Product(Guid.NewGuid(), Guid.NewGuid(), "P", "p", "D", 10, 10, 10, null, null, null, null));
        _orderRepoMock.Setup(r => r.HasPurchasedProductAsync(uid, pid, default)).ReturnsAsync(true);
        _repoMock.Setup(r => r.ExistsByUserAndProductAsync(uid, pid, default)).ReturnsAsync(false);

        var result = await handler.Handle(new CreateProductReviewCommand(pid, dto, uid), default);

        result.Should().NotBeNull();
        result.Rating.Should().Be(5);
        result.Title.Should().Be("Great");
        _repoMock.Verify(r => r.AddAsync(It.IsAny<ProductReview>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task CreateProductReview_WhenNotPurchased_ShouldThrowForbidden()
    {
        var handler = new CreateProductReviewCommandHandler(_repoMock.Object, _productRepoMock.Object, _orderRepoMock.Object, _uowMock.Object);
        var pid = Guid.NewGuid();
        var uid = Guid.NewGuid();

        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(new Product(Guid.NewGuid(), Guid.NewGuid(), "P", "p", "D", 10, 10, 10, null, null, null, null));
        _orderRepoMock.Setup(r => r.HasPurchasedProductAsync(uid, pid, default)).ReturnsAsync(false);

        await FluentActions.Awaiting(() => handler.Handle(new CreateProductReviewCommand(pid, new ProductReviewCreateDTO(5, "", ""), uid), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task UpdateProductReview_WhenValid_ShouldUpdate()
    {
        var handler = new UpdateProductReviewCommandHandler(_repoMock.Object, _uowMock.Object);
        var rid = Guid.NewGuid();
        var uid = Guid.NewGuid();
        var review = new ProductReview(Guid.NewGuid(), uid, 4, "Good", "Ok");

        _repoMock.Setup(r => r.GetByIdAsync(rid, default)).ReturnsAsync(review);

        var result = await handler.Handle(new UpdateProductReviewCommand(rid, new ProductReviewUpdateDTO(5, "Better", "Nice"), uid), default);

        result.Rating.Should().Be(5);
        result.Title.Should().Be("Better");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeleteProductReview_WhenAdmin_ShouldDelete()
    {
        var handler = new DeleteProductReviewCommandHandler(_repoMock.Object, _uowMock.Object);
        var rid = Guid.NewGuid();
        var review = new ProductReview(Guid.NewGuid(), Guid.NewGuid(), 4, "Good", "Ok");

        _repoMock.Setup(r => r.GetByIdAsync(rid, default)).ReturnsAsync(review);

        await handler.Handle(new DeleteProductReviewCommand(rid, Guid.NewGuid(), "ADMIN"), default);

        _repoMock.Verify(r => r.DeleteAsync(review, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
