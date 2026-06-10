namespace Bio.Domain.Enums;

/// <summary>
/// Status values for marketplace orders.
/// </summary>
public static class OrderStatus
{
    public const string Pending = "Pending";
    public const string Paid = "Paid";
    public const string Shipped = "Shipped";
    public const string Delivered = "Delivered";
    public const string Cancelled = "Cancelled";

    public static readonly string[] All = { Pending, Paid, Shipped, Delivered, Cancelled };

    public static bool IsValid(string status) => All.Contains(status);
}
