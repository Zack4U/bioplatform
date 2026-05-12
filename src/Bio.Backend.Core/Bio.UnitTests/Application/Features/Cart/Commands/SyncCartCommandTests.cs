using Bio.Application.DTOs;
using Bio.Application.Features.Cart.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Cart.Commands;

public class SyncCartCommandTests
{
    private readonly Mock<ICartRepository> _cartRepoMock = new();
    private readonly Mock<IProductRepository> _productRepoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    private Product CreateProduct(Guid id, int stock = 10, bool isActive = true)
    {
        var product = new Product(Guid.NewGuid(), Guid.NewGuid(), "P", "p", "D", 10, 10, stock, null, null, null, null);
        if (isActive) product.Activate();
        return product;
    }

    [Fact]
    public async Task SyncCart_WhenEmpty_ShouldReturnExistingCart()
    {
        var handler = new SyncCartCommandHandler(_cartRepoMock.Object, _productRepoMock.Object, _uowMock.Object);
        var uid = Guid.NewGuid();
        var cart = new Bio.Domain.Entities.Cart(uid);

        _cartRepoMock.Setup(r => r.GetByUserIdAsync(uid, default)).ReturnsAsync(cart);

        var result = await handler.Handle(new SyncCartCommand(uid, new CartSyncRequestDTO(new List<CartSyncItemDTO>())), default);

        result.Should().NotBeNull();
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Never);
    }

    [Fact]
    public async Task SyncCart_WhenValid_ShouldMergeItems()
    {
        var handler = new SyncCartCommandHandler(_cartRepoMock.Object, _productRepoMock.Object, _uowMock.Object);
        var uid = Guid.NewGuid();
        var pid = Guid.NewGuid();
        var dto = new CartSyncRequestDTO(new List<CartSyncItemDTO> { new(pid, 2) });
        var cart = new Bio.Domain.Entities.Cart(uid);
        var product = CreateProduct(pid, 10, true);

        _cartRepoMock.Setup(r => r.GetByUserIdAsync(uid, default)).ReturnsAsync(cart);
        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(product);
        _cartRepoMock.Setup(r => r.GetItemByProductAsync(cart.Id, pid, default)).ReturnsAsync((CartItem?)null);

        var result = await handler.Handle(new SyncCartCommand(uid, dto), default);

        _cartRepoMock.Verify(r => r.AddItemAsync(It.IsAny<CartItem>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
