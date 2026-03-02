using Bio.Application.Common.Interfaces;
using Bio.Application.Orders.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Bio.Application.Orders.Commands.CreateOrder;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentService _paymentService;

    public CreateOrderCommandHandler(IApplicationDbContext context, IPaymentService paymentService)
    {
        _context = context;
        _paymentService = paymentService;
    }

    public async Task<OrderResponseDto> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        decimal totalAmount = 0;

        foreach (var item in request.Items)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == item.ProductId, cancellationToken);

            if (product == null)
                throw new Exception($"Producto {item.ProductId} no encontrado.");

            if (product.StockQuantity < item.Quantity)
                throw new Exception($"Stock insuficiente para {product.Name}.");

            totalAmount += product.Price * item.Quantity;
        }

        var clientSecret = await _paymentService.CreatePaymentIntent(totalAmount, request.Currency);

        return new OrderResponseDto
        {
            OrderId = Guid.NewGuid(),
            TransactionId = $"BIO_{Guid.NewGuid().ToString()[..8].ToUpper()}",
            TotalAmount = totalAmount,
            Status = "PendingPayment",
            StripeClientSecret = clientSecret
        };
    }
}