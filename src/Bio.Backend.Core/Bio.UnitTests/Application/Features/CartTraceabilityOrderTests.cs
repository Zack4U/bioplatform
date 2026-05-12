using Bio.Application.DTOs;
using Bio.Application.Features.Cart.Commands;
using Bio.Application.Features.Cart.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features;

/// <summary>Tests for Cart CQRS handlers.</summary>
public class CartHandlerTests
{
    private readonly Mock<ICartRepository> _cartRepo = new();
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly Guid ProductId = Guid.NewGuid();

    [Fact]
    public async Task AddCartItem_ShouldThrow_WhenProductNotFound()
    {
        _productRepo.Setup(x => x.GetByIdAsync(ProductId, default)).ReturnsAsync((Product?)null);

        var handler = new AddCartItemCommandHandler(_cartRepo.Object, _productRepo.Object, _uow.Object, new Mock<Microsoft.Extensions.Logging.ILogger<AddCartItemCommandHandler>>().Object);
        var act = () => handler.Handle(new AddCartItemCommand(UserId, new CartItemAddDTO { ProductId = ProductId, Quantity = 1 }), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task AddCartItem_ShouldThrow_WhenProductInactive()
    {
        var product = new Product(Guid.NewGuid(), Guid.NewGuid(), "Test", "test", "Desc", 10, 15, 5);
        // Product starts inactive by default
        _productRepo.Setup(x => x.GetByIdAsync(product.Id, default)).ReturnsAsync(product);

        var handler = new AddCartItemCommandHandler(_cartRepo.Object, _productRepo.Object, _uow.Object, new Mock<Microsoft.Extensions.Logging.ILogger<AddCartItemCommandHandler>>().Object);
        var act = () => handler.Handle(new AddCartItemCommand(UserId, new CartItemAddDTO { ProductId = product.Id, Quantity = 1 }), default);

        await act.Should().ThrowAsync<ValidationException>().WithMessage("*not available*");
    }

    [Fact]
    public async Task ToggleCartItem_ShouldThrow_WhenNotOwner()
    {
        var otherUserId = Guid.NewGuid();
        var cart = new Cart(otherUserId);
        var item = new CartItem(cart.Id, ProductId, 1);

        _cartRepo.Setup(x => x.GetItemByIdAsync(item.Id, default)).ReturnsAsync(item);
        _cartRepo.Setup(x => x.GetByIdWithItemsAsync(cart.Id, default)).ReturnsAsync(cart);

        var handler = new ToggleCartItemCommandHandler(_cartRepo.Object, _uow.Object);
        var act = () => handler.Handle(new ToggleCartItemCommand(UserId, item.Id), default);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public void CartItem_Toggle_ShouldFlipIsActive()
    {
        var item = new CartItem(Guid.NewGuid(), ProductId, 2);
        item.IsActive.Should().BeTrue("Items start active");
        item.Toggle();
        item.IsActive.Should().BeFalse("After toggle should be inactive");
        item.Toggle();
        item.IsActive.Should().BeTrue("After second toggle should be active again");
    }

    [Fact]
    public void CartItem_UpdateQuantity_ShouldThrow_WhenZeroOrNegative()
    {
        var item = new CartItem(Guid.NewGuid(), ProductId, 2);

        Action actZero = () => item.UpdateQuantity(0);
        Action actNeg = () => item.UpdateQuantity(-1);

        actZero.Should().Throw<ArgumentException>();
        actNeg.Should().Throw<ArgumentException>();
    }

    [Fact]
    public async Task ClearCart_ShouldSucceed_WhenNoCartExists()
    {
        _cartRepo.Setup(x => x.GetByUserIdAsync(UserId, default)).ReturnsAsync((Cart?)null);

        var handler = new ClearCartCommandHandler(_cartRepo.Object, _uow.Object, new Mock<Microsoft.Extensions.Logging.ILogger<ClearCartCommandHandler>>().Object);
        var result = await handler.Handle(new ClearCartCommand(UserId), default);

        result.Should().Be(MediatR.Unit.Value);
        _uow.Verify(x => x.SaveChangesAsync(default), Times.Never);
    }

    [Fact]
    public async Task GetCart_ShouldReturnNull_WhenNoCart()
    {
        _cartRepo.Setup(x => x.GetByUserIdAsync(UserId, default)).ReturnsAsync((Cart?)null);

        var handler = new GetCartQueryHandler(_cartRepo.Object);
        var result = await handler.Handle(new GetCartQuery(UserId), default);

        result.Should().BeNull();
    }
}

/// <summary>Tests for TraceabilityBatch CQRS handlers.</summary>
public class TraceabilityHandlerTests
{
    private readonly Mock<ITraceabilityBatchRepository> _repo = new();
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private static readonly Guid EntrepreneurId = Guid.NewGuid();
    private static readonly Guid ProductId = Guid.NewGuid();
    private static readonly Guid OtherUserId = Guid.NewGuid();

    [Fact]
    public async Task CreateBatch_ShouldThrow_WhenProductNotFound()
    {
        _productRepo.Setup(x => x.GetByIdAsync(ProductId, default)).ReturnsAsync((Product?)null);

        var handler = new Bio.Application.Features.Traceability.Commands.CreateTraceabilityBatchCommandHandler(
            _repo.Object, _productRepo.Object, _uow.Object);

        var dto = new TraceabilityBatchCreateDTO
        {
            BatchCode = "BATCH-001",
            HarvestDate = DateTime.UtcNow.AddDays(-10),
            OriginLocation = "Amazonas, Colombia"
        };

        var act = () => handler.Handle(
            new Bio.Application.Features.Traceability.Commands.CreateTraceabilityBatchCommand(
                ProductId, dto, EntrepreneurId, "ENTREPRENEUR"), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task CreateBatch_ShouldThrow_WhenNotOwner()
    {
        var product = new Product(EntrepreneurId, Guid.NewGuid(), "Test", "test", "Desc", 10, 15, 5);
        _productRepo.Setup(x => x.GetByIdAsync(product.Id, default)).ReturnsAsync(product);
        _repo.Setup(x => x.ExistsByBatchCodeAsync(It.IsAny<string>(), default)).ReturnsAsync(false);

        var handler = new Bio.Application.Features.Traceability.Commands.CreateTraceabilityBatchCommandHandler(
            _repo.Object, _productRepo.Object, _uow.Object);

        var dto = new TraceabilityBatchCreateDTO
        {
            BatchCode = "BATCH-002",
            HarvestDate = DateTime.UtcNow.AddDays(-5),
            OriginLocation = "Chocó, Colombia"
        };

        var act = () => handler.Handle(
            new Bio.Application.Features.Traceability.Commands.CreateTraceabilityBatchCommand(
                product.Id, dto, OtherUserId, "ENTREPRENEUR"), default);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task CreateBatch_ShouldThrow_WhenBatchCodeDuplicate()
    {
        var product = new Product(EntrepreneurId, Guid.NewGuid(), "Test", "test", "Desc", 10, 15, 5);
        _productRepo.Setup(x => x.GetByIdAsync(product.Id, default)).ReturnsAsync(product);
        _repo.Setup(x => x.ExistsByBatchCodeAsync("BATCH-DUP", default)).ReturnsAsync(true);

        var handler = new Bio.Application.Features.Traceability.Commands.CreateTraceabilityBatchCommandHandler(
            _repo.Object, _productRepo.Object, _uow.Object);

        var dto = new TraceabilityBatchCreateDTO
        {
            BatchCode = "BATCH-DUP",
            HarvestDate = DateTime.UtcNow.AddDays(-5),
            OriginLocation = "Chocó, Colombia"
        };

        var act = () => handler.Handle(
            new Bio.Application.Features.Traceability.Commands.CreateTraceabilityBatchCommand(
                product.Id, dto, EntrepreneurId, "ENTREPRENEUR"), default);

        await act.Should().ThrowAsync<ConflictException>();
    }
}

/// <summary>Tests for Order state machine via UpdateOrderStatusCommand.</summary>
public class OrderStateMachineTests
{
    private static Order MakeOrder(string status = "Pending")
    {
        var order = new Order(Guid.NewGuid(), "ORD-20260101-0001", 100, 100, "Card");
        // Transition to requested status via valid path
        if (status == "Paid") order.UpdateStatus("Paid");
        else if (status == "Shipped") { order.UpdateStatus("Paid"); order.UpdateStatus("Shipped"); }
        else if (status == "Delivered") { order.UpdateStatus("Paid"); order.UpdateStatus("Shipped"); order.UpdateStatus("Delivered"); }
        else if (status == "Cancelled") order.UpdateStatus("Cancelled");
        return order;
    }

    [Fact]
    public void UpdateStatus_ShouldSucceed_PendingToPaid()
    {
        var order = MakeOrder("Pending");
        order.UpdateStatus("Paid");
        order.Status.Should().Be("Paid");
    }

    [Fact]
    public void UpdateStatus_ShouldThrow_PendingToShipped()
    {
        var order = MakeOrder("Pending");
        Action act = () => order.UpdateStatus("Shipped");
        act.Should().Throw<ValidationException>().WithMessage("*Invalid status transition*");
    }

    [Fact]
    public void UpdateStatus_ShouldThrow_DeliveredToPending()
    {
        var order = MakeOrder("Delivered");
        Action act = () => order.UpdateStatus("Pending");
        act.Should().Throw<ValidationException>().WithMessage("*Invalid status transition*");
    }

    [Fact]
    public void UpdateStatus_ShouldThrow_CancelledToPaid()
    {
        var order = MakeOrder("Cancelled");
        Action act = () => order.UpdateStatus("Paid");
        act.Should().Throw<ValidationException>().WithMessage("*Invalid status transition*");
    }

    [Fact]
    public void UpdateStatus_ShouldSucceed_PaidToShipped()
    {
        var order = MakeOrder("Paid");
        order.UpdateStatus("Shipped");
        order.Status.Should().Be("Shipped");
    }

    [Fact]
    public void UpdateStatus_ShouldSucceed_ShippedToDelivered()
    {
        var order = MakeOrder("Shipped");
        order.UpdateStatus("Delivered");
        order.Status.Should().Be("Delivered");
    }
}
