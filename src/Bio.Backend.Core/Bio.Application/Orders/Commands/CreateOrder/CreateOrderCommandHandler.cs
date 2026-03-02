using Bio.Application.Common.Interfaces;
using Bio.Application.Orders.Common;
using Bio.Domain.Entities; // IMPORTANTE: Para corregir CS0246
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
        var validatedItems = new List<(Product Product, int Quantity)>();
        decimal totalAmount = 0;

        // 1. Validar productos y stock
        foreach (var item in request.Items)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == item.ProductId, cancellationToken);

            if (product == null) throw new Exception($"Producto {item.ProductId} no encontrado.");
            if (product.StockQuantity < item.Quantity) throw new Exception($"Stock insuficiente para {product.Name}.");

            validatedItems.Add((product, item.Quantity));
            totalAmount += product.Price * item.Quantity;
        }

        // 2. Generar el secreto en Stripe
        // Modifica esto para obtener el PaymentIntent completo o asegúrate de que clientSecret no sea nulo
        var clientSecret = await _paymentService.CreatePaymentIntent(totalAmount, request.Currency);

        // 3. Persistir la Orden
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}",
            BuyerId = request.BuyerId,
            TotalAmount = totalAmount,
            SubtotalAmount = totalAmount,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            // StripePaymentIntentId = clientSecret.Split('_secret')[0] // Opcional: Extraer ID del secreto
        };

        foreach (var v in validatedItems)
        {
            // AGREGAR DIRECTAMENTE A LA COLECCIÓN DE LA ORDEN
            order.OrderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = v.Product.Id,
                SellerId = v.Product.EntrepreneurId,
                ProductName = v.Product.Name,
                Quantity = v.Quantity,
                UnitPrice = v.Product.Price,
                TotalPrice = v.Product.Price * v.Quantity
            });
        }

        _context.Orders.Add(order);

        var result = await _context.SaveChangesAsync(cancellationToken);

        // LOG DE DEPURACIÓN ARCHITECT
        Console.WriteLine($"[DB_DEBUG] Registros afectados: {result}. Orden ID: {order.Id}");

        if (result <= 0) throw new Exception("Error crítico: No se pudo persistir la orden en SQL Server.");

        return new OrderResponseDto
        {
            OrderId = order.Id,
            TransactionId = order.OrderNumber,
            TotalAmount = totalAmount,
            Status = order.Status,
            StripeClientSecret = clientSecret
        };
    }
}