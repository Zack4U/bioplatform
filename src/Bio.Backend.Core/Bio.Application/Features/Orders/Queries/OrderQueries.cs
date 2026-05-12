using Bio.Application.DTOs;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;
using Bio.Application.Features.Orders.Commands;

namespace Bio.Application.Features.Orders.Queries;

public record GetOrderByIdQuery(Guid OrderId, Guid ActorId, string ActorRole) : IRequest<OrderResponseDTO>;

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderResponseDTO>
{
    private readonly IOrderRepository _repo;
    public GetOrderByIdQueryHandler(IOrderRepository repo) => _repo = repo;

    public async Task<OrderResponseDTO> Handle(GetOrderByIdQuery request, CancellationToken ct)
    {
        var order = await _repo.GetByIdWithItemsAsync(request.OrderId, ct)
            ?? throw new NotFoundException("Order", request.OrderId);
        if (request.ActorRole != "ADMIN" && order.BuyerId != request.ActorId)
            throw new ForbiddenException("You can only view your own orders.");
        return CreateOrderCommandHandler.MapToResponse(order);
    }
}

public record GetMyOrdersQuery(Guid BuyerId, int Page = 1, int PageSize = 10) : IRequest<PaginatedResult<OrderResponseDTO>>;

public class GetMyOrdersQueryHandler : IRequestHandler<GetMyOrdersQuery, PaginatedResult<OrderResponseDTO>>
{
    private readonly IOrderRepository _repo;
    public GetMyOrdersQueryHandler(IOrderRepository repo) => _repo = repo;

    public async Task<PaginatedResult<OrderResponseDTO>> Handle(GetMyOrdersQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetByBuyerIdAsync(request.BuyerId, request.Page, request.PageSize, ct);
        var dtos = items.Select(CreateOrderCommandHandler.MapToResponse).ToList();
        return PaginatedResult<OrderResponseDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}

public record GetManagedOrdersQuery(string? Status = null, int Page = 1, int PageSize = 10) : IRequest<PaginatedResult<OrderResponseDTO>>;

public class GetManagedOrdersQueryHandler : IRequestHandler<GetManagedOrdersQuery, PaginatedResult<OrderResponseDTO>>
{
    private readonly IOrderRepository _repo;
    public GetManagedOrdersQueryHandler(IOrderRepository repo) => _repo = repo;

    public async Task<PaginatedResult<OrderResponseDTO>> Handle(GetManagedOrdersQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetManagedAsync(request.Status, request.Page, request.PageSize, ct);
        var dtos = items.Select(CreateOrderCommandHandler.MapToResponse).ToList();
        return PaginatedResult<OrderResponseDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}
