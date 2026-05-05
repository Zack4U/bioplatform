namespace Bio.Domain.Enums;

/// <summary>
/// Types of product certifications supported by the platform.
/// </summary>
public static class CertificationType
{
    public const string Sustainability = "Sustainability";
    public const string Organic = "Organic";
    public const string Quality = "Quality";
    public const string FairTrade = "FairTrade";
    public const string ABS = "ABS";

    public static readonly string[] All = { Sustainability, Organic, Quality, FairTrade, ABS };

    public static bool IsValid(string type) => All.Contains(type);
}
