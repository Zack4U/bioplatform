using Bio.Application.DTOs;
using Bio.Application.Features.Orders.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Orders.Queries;

public class OrderQueriesTests
{
    private readonly Mock<IOrderRepository> _repoMock = new();

    private Order CreateSampleOrder(Guid buyerId)
    {
        return new Order(buyerId, "ORD-123", 100m, 100m, "Card");
    }

    [Fact]
    public async Task GetOrderById_WhenOwner_ShouldReturnOrder()
    {
        var orderId = Guid.NewGuid();
        var buyerId = Guid.NewGuid();
        var order = CreateSampleOrder(buyerId);

        _repoMock.Setup(r => r.GetByIdWithItemsAsync(orderId, default)).ReturnsAsync(order);

        var handler = new GetOrderByIdQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetOrderByIdQuery(orderId, buyerId, "BUYER"), default);

        result.Should().NotBeNull();
        result.OrderNumber.Should().Be("ORD-123");
    }

    [Fact]
    public async Task GetOrderById_WhenAdmin_ShouldReturnOrder()
    {
        var orderId = Guid.NewGuid();
        var buyerId = Guid.NewGuid();
        var order = CreateSampleOrder(buyerId);

        _repoMock.Setup(r => r.GetByIdWithItemsAsync(orderId, default)).ReturnsAsync(order);

        var handler = new GetOrderByIdQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetOrderByIdQuery(orderId, Guid.NewGuid(), "ADMIN"), default);

        result.Should().NotBeNull();
        result.OrderNumber.Should().Be("ORD-123");
    }

    [Fact]
    public async Task GetOrderById_WhenNotOwnerOrAdmin_ShouldThrowForbidden()
    {
        var orderId = Guid.NewGuid();
        var buyerId = Guid.NewGuid();
        var order = CreateSampleOrder(buyerId);

        _repoMock.Setup(r => r.GetByIdWithItemsAsync(orderId, default)).ReturnsAsync(order);

        var handler = new GetOrderByIdQueryHandler(_repoMock.Object);

        await FluentActions.Awaiting(() => handler.Handle(new GetOrderByIdQuery(orderId, Guid.NewGuid(), "BUYER"), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GetMyOrders_ShouldReturnPaginatedList()
    {
        var buyerId = Guid.NewGuid();
        var orders = new List<Order> { CreateSampleOrder(buyerId) };

        _repoMock.Setup(r => r.GetByBuyerIdAsync(buyerId, 1, 10, default)).ReturnsAsync((orders, 1));

        var handler = new GetMyOrdersQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetMyOrdersQuery(buyerId), default);

        result.Items.Should().HaveCount(1);
        result.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task GetManagedOrders_ShouldReturnPaginatedList()
    {
        var orders = new List<Order> { CreateSampleOrder(Guid.NewGuid()) };

        _repoMock.Setup(r => r.GetManagedAsync(null, 1, 10, default, null)).ReturnsAsync((orders, 1));

        var handler = new GetManagedOrdersQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetManagedOrdersQuery(), default);

        result.Items.Should().HaveCount(1);
        result.TotalCount.Should().Be(1);
    }
}
