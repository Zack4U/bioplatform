namespace Bio.Domain.Enums;

/// <summary>
/// Target types for user favorites/wishlist entries.
/// </summary>
public static class FavoriteTargetType
{
    public const string Product = "Product";
    public const string Species = "Species";

    public static readonly string[] All = { Product, Species };

    public static bool IsValid(string type) => All.Contains(type);
}
