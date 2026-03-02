using Bio.Application.Common.Interfaces;
using Stripe;

namespace Bio.Infrastructure.Services;

public class StripePaymentService : IPaymentService
{
    public async Task<string> CreatePaymentIntent(decimal amount, string currency)
    {
        var options = new PaymentIntentCreateOptions
        {
            Amount = (long)(amount * 100), // Centavos
            Currency = currency,
            PaymentMethodTypes = new List<string> { "card" }
        };

        var service = new PaymentIntentService();
        var intent = await service.CreateAsync(options);
        return intent.ClientSecret;
    }
}