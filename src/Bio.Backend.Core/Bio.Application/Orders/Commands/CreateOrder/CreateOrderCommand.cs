using Bio.Application.Orders.Common;
using MediatR;

namespace Bio.Application.Orders.Commands.CreateOrder;

public record CreateOrderCommand : IRequest<OrderResponseDto>
{
    public Guid BuyerId { get; init; }
    public string Currency { get; init; } = "usd";
    public List<OrderItemDto> Items { get; init; } = new();
}

public record OrderItemDto
{
    public Guid ProductId { get; init; }
    public int Quantity { get; init; }
}