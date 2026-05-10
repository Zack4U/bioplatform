using Bio.Domain.Exceptions;

namespace Bio.Domain.Entities;

/// <summary>
/// Purchase order header. Contains one or more order items.
/// Table: Orders (SQL Server).
/// </summary>
public class Order
{
    public Guid Id { get; private set; }
    public string OrderNumber { get; private set; } = string.Empty;
    public Guid BuyerId { get; private set; }
    public Guid? ShippingAddressId { get; private set; }
    public Guid? BillingAddressId { get; private set; }
    public decimal TotalAmount { get; private set; }
    public decimal SubtotalAmount { get; private set; }
    public decimal TaxAmount { get; private set; } = 0;
    public decimal ShippingAmount { get; private set; } = 0;
    public decimal DiscountAmount { get; private set; } = 0;
    public string Status { get; private set; } = "Pending";
    public string PaymentMethod { get; private set; } = string.Empty;
    public string? TransactionRef { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    /// <summary>Row version token used by EF Core for optimistic concurrency control.</summary>
    public byte[]? RowVersion { get; private set; }

    // Navigation properties
    public User Buyer { get; private set; } = null!;
    public Address? ShippingAddress { get; private set; }
    public Address? BillingAddress { get; private set; }
    public ICollection<OrderItem> OrderItems { get; private set; } = new List<OrderItem>();

    private Order() { }

    public Order(
        Guid buyerId,
        string orderNumber,
        decimal subtotalAmount,
        decimal totalAmount,
        string paymentMethod,
        decimal taxAmount = 0,
        decimal shippingAmount = 0,
        decimal discountAmount = 0,
        Guid? shippingAddressId = null,
        Guid? billingAddressId = null)
    {
        Id = Guid.NewGuid();
        BuyerId = buyerId;
        OrderNumber = orderNumber;
        SubtotalAmount = subtotalAmount;
        TotalAmount = totalAmount;
        PaymentMethod = paymentMethod;
        TaxAmount = taxAmount;
        ShippingAmount = shippingAmount;
        DiscountAmount = discountAmount;
        ShippingAddressId = shippingAddressId;
        BillingAddressId = billingAddressId;
    }

    // ─── Allowed status transitions (State Machine) ───────────────────────────
    private static readonly Dictionary<string, HashSet<string>> AllowedTransitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Pending"]   = ["Paid", "Cancelled"],
        ["Paid"]      = ["Shipped", "Refunded", "Cancelled"],
        ["Shipped"]   = ["Delivered", "Returned"],
        ["Delivered"] = ["Returned"],
        ["Cancelled"] = [],
        ["Refunded"]  = [],
        ["Returned"]  = [],
    };

    /// <summary>
    /// Updates the order status, enforcing valid transitions (State Machine).
    /// Valid flow: Pending -> Paid -> Shipped -> Delivered | Returned.
    ///             Pending | Paid -> Cancelled.
    ///             Paid -> Refunded.
    /// </summary>
    public void UpdateStatus(string newStatus)
    {
        if (string.IsNullOrWhiteSpace(newStatus))
            throw new ArgumentException("Status cannot be empty.", nameof(newStatus));

        if (!AllowedTransitions.TryGetValue(Status, out var allowed) || !allowed.Contains(newStatus))
            throw new ValidationException($"Invalid status transition from '{Status}' to '{newStatus}'.");

        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Sets payment transaction reference after payment is processed.
    /// </summary>
    public void SetPaymentInfo(string transactionRef, string paymentMethod)
    {
        TransactionRef = transactionRef;
        PaymentMethod = paymentMethod;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Updates shipping and billing addresses.
    /// </summary>
    public void SetAddresses(Guid? shippingAddressId, Guid? billingAddressId)
    {
        ShippingAddressId = shippingAddressId;
        BillingAddressId = billingAddressId;
        UpdatedAt = DateTime.UtcNow;
    }
}
