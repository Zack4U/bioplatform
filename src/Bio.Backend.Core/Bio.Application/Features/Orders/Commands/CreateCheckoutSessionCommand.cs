using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using Bio.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Threading;
using System.Threading.Tasks;

namespace Bio.Application.Features.Orders.Commands;

public record CreateCheckoutSessionCommand(System.Guid OrderId, System.Guid UserId, string ReturnUrl) : IRequest<CheckoutSessionResponseDTO>;

public class CreateCheckoutSessionCommandHandler : IRequestHandler<CreateCheckoutSessionCommand, CheckoutSessionResponseDTO>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IPaymentService _paymentService;

    public CreateCheckoutSessionCommandHandler(IOrderRepository orderRepo, IPaymentService paymentService)
    {
        _orderRepo = orderRepo;
        _paymentService = paymentService;
    }

    public async Task<CheckoutSessionResponseDTO> Handle(CreateCheckoutSessionCommand request, CancellationToken ct)
    {
        var order = await _orderRepo.GetByIdWithItemsAsync(request.OrderId, ct)
            ?? throw new NotFoundException(nameof(Order), request.OrderId);

        if (order.BuyerId != request.UserId)
            throw new System.UnauthorizedAccessException("Order does not belong to the user.");

        // SuccessUrl: Stripe redirects here after payment — we pass the session_id for verification
        string successUrl = $"{request.ReturnUrl}&payment=success&session_id={{CHECKOUT_SESSION_ID}}";
        // CancelUrl: Stripe redirects here if user cancels
        string cancelUrl = $"{request.ReturnUrl}&payment=cancelled";

        var checkoutUrl = await _paymentService.CreateHostedCheckoutSessionAsync(order, successUrl, cancelUrl, ct);

        return new CheckoutSessionResponseDTO(checkoutUrl);
    }
}
