using Bio.Application.DTOs;
using Bio.Application.Features.Orders.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Orders.Commands;

public class OrderCommandsTests
{
    private readonly Mock<IOrderRepository> _orderRepoMock = new();
    private readonly Mock<IProductRepository> _productRepoMock = new();
    private readonly Mock<ICartRepository> _cartRepoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();
    private readonly Mock<ILogger<CreateOrderCommandHandler>> _loggerMock = new();

    [Fact]
    public async Task CreateOrder_WhenEmptyItems_ShouldThrowValidationException()
    {
        var handler = new CreateOrderCommandHandler(_orderRepoMock.Object, _productRepoMock.Object, _cartRepoMock.Object, _uowMock.Object, _loggerMock.Object);
        var dto = new OrderCreateDTO { PaymentMethod = "Card", Items = new List<OrderItemCreateDTO>() };

        await FluentActions.Awaiting(() => handler.Handle(new CreateOrderCommand(dto, Guid.NewGuid()), default))
            .Should().ThrowAsync<ValidationException>().WithMessage("*at least one item*");
    }

    [Fact]
    public async Task CreateOrder_WhenDuplicateItems_ShouldThrowValidationException()
    {
        var handler = new CreateOrderCommandHandler(_orderRepoMock.Object, _productRepoMock.Object, _cartRepoMock.Object, _uowMock.Object, _loggerMock.Object);
        var pid = Guid.NewGuid();
        var dto = new OrderCreateDTO { PaymentMethod = "Card", Items = new List<OrderItemCreateDTO> {
            new(pid, 1), new(pid, 2)
        } };

        await FluentActions.Awaiting(() => handler.Handle(new CreateOrderCommand(dto, Guid.NewGuid()), default))
            .Should().ThrowAsync<ValidationException>().WithMessage("*Duplicate products*");
    }

    [Fact]
    public async Task CreateOrder_WhenValid_ShouldCreateAndClearCart()
    {
        var handler = new CreateOrderCommandHandler(_orderRepoMock.Object, _productRepoMock.Object, _cartRepoMock.Object, _uowMock.Object, _loggerMock.Object);
        var pid = Guid.NewGuid();
        var dto = new OrderCreateDTO { PaymentMethod = "Card", Items = new List<OrderItemCreateDTO> { new(pid, 2) } };
        
        var product = new Product(Guid.NewGuid(), Guid.NewGuid(), "P", "p", "D", 10, 10, 5, null, null, null, null);
        product.Activate();

        _orderRepoMock.Setup(r => r.GenerateOrderNumberAsync(default)).ReturnsAsync("ORD-123");
        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(product);
        _cartRepoMock.Setup(r => r.GetByUserIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync((Cart?)null);
        _orderRepoMock.Setup(r => r.GetByIdWithItemsAsync(It.IsAny<Guid>(), default)).ReturnsAsync(new Order(Guid.NewGuid(), "ORD-123", 20m, 20m, "Card"));
        
        var result = await handler.Handle(new CreateOrderCommand(dto, Guid.NewGuid()), default);

        result.Should().NotBeNull();
        result.OrderNumber.Should().Be("ORD-123");
        _uowMock.Verify(u => u.CommitTransactionAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateOrderStatus_ShouldUpdateAndReturn()
    {
        var orderId = Guid.NewGuid();
        var order = new Order(Guid.NewGuid(), "ORD", 10m, 10m, "Card");
        
        _orderRepoMock.Setup(r => r.GetByIdWithItemsAsync(orderId, default)).ReturnsAsync(order);
        var handler = new UpdateOrderStatusCommandHandler(_orderRepoMock.Object, _uowMock.Object);
        
        var result = await handler.Handle(new UpdateOrderStatusCommand(orderId, "Paid"), default);
        
        result.Status.Should().Be("Paid");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
