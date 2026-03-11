namespace Bio.Domain.Entities;

public class Order
{
    public Guid Id { get; private set; }
    public string OrderNumber { get; private set; } = string.Empty;
    public Guid BuyerId { get; private set; }
    public decimal TotalAmount { get; private set; }
    public decimal SubtotalAmount { get; private set; }
    public decimal TaxAmount { get; private set; } = 0;
    public decimal ShippingAmount { get; private set; } = 0;
    public decimal DiscountAmount { get; private set; } = 0;
    public string Status { get; private set; } = "Pending";
    public string PaymentMethod { get; private set; } = string.Empty;
    public string? TransactionRef { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public User Buyer { get; private set; } = null!;
    public ICollection<OrderItem> OrderItems { get; private set; } = new List<OrderItem>();

    private Order() { }

    public Order(Guid buyerId, string orderNumber, decimal totalAmount, decimal subtotalAmount)
    {
        Id = Guid.NewGuid();
        BuyerId = buyerId;
        OrderNumber = orderNumber;
        TotalAmount = totalAmount;
        SubtotalAmount = subtotalAmount;
    }
}
