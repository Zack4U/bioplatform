using Bio.Application.DTOs;
using Bio.Application.Features.Cart.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Cart.Commands;

public class CartCommandsTests
{
    private readonly Mock<ICartRepository> _cartRepoMock = new();
    private readonly Mock<IProductRepository> _productRepoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();
    private readonly Mock<ILogger<AddCartItemCommandHandler>> _addLoggerMock = new();
    private readonly Mock<ILogger<ClearCartCommandHandler>> _clearLoggerMock = new();

    private Product CreateProduct(Guid id, bool isActive = true)
    {
        var product = new Product(Guid.NewGuid(), Guid.NewGuid(), "P", "p", "D", 10, 10, 10, null, null, null, null);
        if (isActive) product.Activate();
        return product;
    }

    [Fact]
    public async Task AddCartItem_WhenProductNotFound_ShouldThrowNotFound()
    {
        var handler = new AddCartItemCommandHandler(_cartRepoMock.Object, _productRepoMock.Object, _uowMock.Object, _addLoggerMock.Object);
        var dto = new CartItemAddDTO(Guid.NewGuid(), 1);

        _productRepoMock.Setup(r => r.GetByIdAsync(dto.ProductId, default)).ReturnsAsync((Product?)null);

        await FluentActions.Awaiting(() => handler.Handle(new AddCartItemCommand(Guid.NewGuid(), dto), default))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task AddCartItem_WhenProductNotActive_ShouldThrowValidationException()
    {
        var handler = new AddCartItemCommandHandler(_cartRepoMock.Object, _productRepoMock.Object, _uowMock.Object, _addLoggerMock.Object);
        var pid = Guid.NewGuid();
        var dto = new CartItemAddDTO(pid, 1);
        var product = CreateProduct(pid, false);

        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(product);

        await FluentActions.Awaiting(() => handler.Handle(new AddCartItemCommand(Guid.NewGuid(), dto), default))
            .Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task AddCartItem_WhenValidNewItem_ShouldCreateCartAndItem()
    {
        var handler = new AddCartItemCommandHandler(_cartRepoMock.Object, _productRepoMock.Object, _uowMock.Object, _addLoggerMock.Object);
        var pid = Guid.NewGuid();
        var uid = Guid.NewGuid();
        var dto = new CartItemAddDTO(pid, 2);
        var product = CreateProduct(pid);
        var cart = new Bio.Domain.Entities.Cart(uid);

        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(product);
        _cartRepoMock.Setup(r => r.GetByUserIdAsync(uid, default)).ReturnsAsync((Bio.Domain.Entities.Cart?)null).Callback(() =>
        {
            _cartRepoMock.Setup(r => r.GetByUserIdAsync(uid, default)).ReturnsAsync(cart);
        });
        _cartRepoMock.Setup(r => r.GetItemByProductAsync(It.IsAny<Guid>(), pid, default)).ReturnsAsync((CartItem?)null);

        var result = await handler.Handle(new AddCartItemCommand(uid, dto), default);

        result.Should().NotBeNull();
        _cartRepoMock.Verify(r => r.AddAsync(It.IsAny<Bio.Domain.Entities.Cart>(), default), Times.Once);
        _cartRepoMock.Verify(r => r.AddItemAsync(It.IsAny<CartItem>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Exactly(2)); // Once for cart, once for item
    }

    [Fact]
    public async Task UpdateCartItem_WhenValid_ShouldUpdateQuantity()
    {
        var handler = new UpdateCartItemCommandHandler(_cartRepoMock.Object, _uowMock.Object);
        var uid = Guid.NewGuid();
        var cart = new Bio.Domain.Entities.Cart(uid);
        var item = new CartItem(cart.Id, Guid.NewGuid(), 1);

        _cartRepoMock.Setup(r => r.GetItemByIdAsync(item.Id, default)).ReturnsAsync(item);
        _cartRepoMock.Setup(r => r.GetByIdWithItemsAsync(item.CartId, default)).ReturnsAsync(cart);
        _cartRepoMock.Setup(r => r.GetByUserIdAsync(uid, default)).ReturnsAsync(cart);

        var result = await handler.Handle(new UpdateCartItemCommand(uid, item.Id, new CartItemUpdateDTO(5)), default);

        item.Quantity.Should().Be(5);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task ToggleCartItem_WhenValid_ShouldToggleStatus()
    {
        var handler = new ToggleCartItemCommandHandler(_cartRepoMock.Object, _uowMock.Object);
        var uid = Guid.NewGuid();
        var cart = new Bio.Domain.Entities.Cart(uid);
        var item = new CartItem(cart.Id, Guid.NewGuid(), 1);

        _cartRepoMock.Setup(r => r.GetItemByIdAsync(item.Id, default)).ReturnsAsync(item);
        _cartRepoMock.Setup(r => r.GetByIdWithItemsAsync(item.CartId, default)).ReturnsAsync(cart);
        _cartRepoMock.Setup(r => r.GetByUserIdAsync(uid, default)).ReturnsAsync(cart);

        var result = await handler.Handle(new ToggleCartItemCommand(uid, item.Id), default);

        item.IsActive.Should().BeFalse();
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task RemoveCartItem_WhenValid_ShouldRemove()
    {
        var handler = new RemoveCartItemCommandHandler(_cartRepoMock.Object, _uowMock.Object);
        var uid = Guid.NewGuid();
        var cart = new Bio.Domain.Entities.Cart(uid);
        var item = new CartItem(cart.Id, Guid.NewGuid(), 1);

        _cartRepoMock.Setup(r => r.GetItemByIdAsync(item.Id, default)).ReturnsAsync(item);
        _cartRepoMock.Setup(r => r.GetByIdWithItemsAsync(item.CartId, default)).ReturnsAsync(cart);
        _cartRepoMock.Setup(r => r.GetByUserIdAsync(uid, default)).ReturnsAsync(cart);

        var result = await handler.Handle(new RemoveCartItemCommand(uid, item.Id), default);

        _cartRepoMock.Verify(r => r.RemoveItemAsync(item, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task ClearCart_WhenValid_ShouldClearAll()
    {
        var handler = new ClearCartCommandHandler(_cartRepoMock.Object, _uowMock.Object, _clearLoggerMock.Object);
        var uid = Guid.NewGuid();
        var cart = new Bio.Domain.Entities.Cart(uid);
        cart.Items.Add(new CartItem(cart.Id, Guid.NewGuid(), 1));

        _cartRepoMock.Setup(r => r.GetByUserIdAsync(uid, default)).ReturnsAsync(cart);

        await handler.Handle(new ClearCartCommand(uid), default);

        _cartRepoMock.Verify(r => r.RemoveItemAsync(It.IsAny<CartItem>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
