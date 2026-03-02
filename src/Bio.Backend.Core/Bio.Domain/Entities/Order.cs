namespace Bio.Domain.Entities;

public class Order
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid BuyerId { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public string? StripeCustomerId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal? TaxAmount { get; set; }
    public decimal? ShippingAmount { get; set; }
    public decimal? DiscountAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public string? PaymentMethod { get; set; }
    public string? PaymentStatus { get; set; }
    public string? TransactionRef { get; set; }
    public string? ShippingAddress { get; set; }
    public string? BillingAddress { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PaidAt { get; set; }

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}