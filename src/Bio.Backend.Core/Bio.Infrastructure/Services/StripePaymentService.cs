using Bio.Application.Interfaces;
using Bio.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Bio.Infrastructure.Services;

public class StripePaymentService : IPaymentService
{
    public StripePaymentService(IConfiguration configuration)
    {
        var secretKey = configuration["Stripe:SecretKey"];
        StripeConfiguration.ApiKey = secretKey;
    }

    public async Task<string> CreateHostedCheckoutSessionAsync(Order order, string successUrl, string cancelUrl, CancellationToken ct)
    {
        // Stripe test keys work best with USD. Convert COP → USD cents at ~4000 COP/USD.
        // Minimum: $1.00 USD (100 cents) to satisfy Stripe's 50-cent minimum threshold.
        const decimal COP_TO_USD_RATE = 4000m;
        var amountUsdCents = (long)Math.Max(100m, Math.Round(order.TotalAmount / COP_TO_USD_RATE * 100));

        // Build a human-readable description of the COP amount for the Stripe receipt
        var copFormatted = string.Format("COP {0:N0}", order.TotalAmount);

        var options = new SessionCreateOptions
        {
            Mode = "payment",
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        UnitAmount = amountUsdCents,
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = "Pedido #" + order.OrderNumber,
                            Description = $"BioCommerce Caldas — {order.OrderItems.Count} producto(s) ({copFormatted})",
                        },
                    },
                    Quantity = 1,
                },
            },
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
            Metadata = new Dictionary<string, string>
            {
                { "OrderId", order.Id.ToString() },
                { "OrderNumber", order.OrderNumber }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options, cancellationToken: ct);

        // Return the hosted Stripe Checkout URL
        return session.Url;
    }
}
