namespace Bio.Application.Orders.Common;

public class OrderResponseDto
{
    public Guid OrderId { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string StripeClientSecret { get; set; } = string.Empty;
}