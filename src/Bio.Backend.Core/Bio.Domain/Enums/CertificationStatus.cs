namespace Bio.Domain.Enums;

/// <summary>
/// Status values for product certifications.
/// </summary>
public static class CertificationStatus
{
    public const string Active = "Active";
    public const string Expired = "Expired";
    public const string Suspended = "Suspended";
    public const string Revoked = "Revoked";

    public static readonly string[] All = { Active, Expired, Suspended, Revoked };

    public static bool IsValid(string status) => All.Contains(status);
}
