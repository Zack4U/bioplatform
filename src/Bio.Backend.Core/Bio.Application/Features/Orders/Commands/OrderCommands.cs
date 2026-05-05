using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Orders.Commands;

public record CreateOrderCommand(OrderCreateDTO Dto, Guid BuyerId) : IRequest<OrderResponseDTO>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderResponseDTO>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public CreateOrderCommandHandler(IOrderRepository orderRepo, IProductRepository productRepo, IUnitOfWork uow)
    { _orderRepo = orderRepo; _productRepo = productRepo; _uow = uow; }

    public async Task<OrderResponseDTO> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        if (request.Dto.Items.Count == 0)
            throw new Bio.Domain.Exceptions.ValidationException("Order must contain at least one item.");

        await _uow.BeginTransactionAsync();
        try
        {
            var orderNumber = await _orderRepo.GenerateOrderNumberAsync(ct);
            var orderItems = new List<OrderItem>();
            decimal subtotal = 0;

            foreach (var item in request.Dto.Items)
            {
                var product = await _productRepo.GetByIdAsync(item.ProductId, ct)
                    ?? throw new NotFoundException(nameof(Product), item.ProductId);

                if (!product.IsActive)
                    throw new Bio.Domain.Exceptions.ValidationException($"Product '{product.Name}' is not active.");

                product.DecrementStock(item.Quantity); // Validates stock
                var orderItem = new OrderItem(Guid.Empty, product.Id, item.Quantity, product.SellPrice);
                orderItems.Add(orderItem);
                subtotal += orderItem.TotalPrice;
            }

            var order = new Order(request.BuyerId, orderNumber, subtotal, subtotal,
                request.Dto.PaymentMethod, shippingAddressId: request.Dto.ShippingAddressId,
                billingAddressId: request.Dto.BillingAddressId);

            await _orderRepo.AddAsync(order, ct);

            // Fix OrderId on items (EF will track)
            foreach (var item in orderItems)
            {
                var corrected = new OrderItem(order.Id, item.ProductId, item.Quantity, item.UnitPrice);
                order.OrderItems.Add(corrected);
            }

            await _uow.SaveChangesAsync(ct);
            await _uow.CommitTransactionAsync();

            var created = await _orderRepo.GetByIdWithItemsAsync(order.Id, ct);
            return MapToResponse(created!);
        }
        catch
        {
            await _uow.RollbackTransactionAsync();
            throw;
        }
    }

    internal static OrderResponseDTO MapToResponse(Order o) => new(
        o.Id, o.OrderNumber, o.BuyerId, o.Status,
        o.SubtotalAmount, o.TaxAmount, o.ShippingAmount, o.DiscountAmount, o.TotalAmount,
        o.PaymentMethod, o.TransactionRef,
        o.OrderItems.Select(i => new OrderItemResponseDTO(
            i.Id, i.ProductId, i.Product?.Name ?? "", i.Quantity, i.UnitPrice, i.TotalPrice)).ToList(),
        o.CreatedAt, o.UpdatedAt);
}

public record UpdateOrderStatusCommand(Guid OrderId, string Status) : IRequest<OrderResponseDTO>;

public class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, OrderResponseDTO>
{
    private readonly IOrderRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpdateOrderStatusCommandHandler(IOrderRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<OrderResponseDTO> Handle(UpdateOrderStatusCommand request, CancellationToken ct)
    {
        var order = await _repo.GetByIdWithItemsAsync(request.OrderId, ct)
            ?? throw new NotFoundException(nameof(Order), request.OrderId);
        order.UpdateStatus(request.Status);
        await _uow.SaveChangesAsync(ct);
        return CreateOrderCommandHandler.MapToResponse(order);
    }
}
