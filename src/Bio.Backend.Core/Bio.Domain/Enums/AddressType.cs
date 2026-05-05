namespace Bio.Domain.Enums;

/// <summary>
/// Types of physical addresses for users.
/// </summary>
public static class AddressType
{
    public const string Shipping = "Shipping";
    public const string Billing = "Billing";

    public static readonly string[] All = { Shipping, Billing };

    public static bool IsValid(string type) => All.Contains(type);
}
