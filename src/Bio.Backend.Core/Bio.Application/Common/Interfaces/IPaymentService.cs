namespace Bio.Application.Common.Interfaces;

public interface IPaymentService
{
    Task<string> CreatePaymentIntent(decimal amount, string currency);
}