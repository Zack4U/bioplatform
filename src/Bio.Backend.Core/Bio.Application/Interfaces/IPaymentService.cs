using Bio.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace Bio.Application.Interfaces;

public interface IPaymentService
{
    /// <summary>Creates a Stripe Hosted Checkout session and returns the redirect URL.</summary>
    Task<string> CreateHostedCheckoutSessionAsync(Order order, string successUrl, string cancelUrl, CancellationToken ct);
}
