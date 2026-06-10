namespace Bio.Domain.Enums;

/// <summary>
/// Status values for product certifications.
/// </summary>
public static class CertificationStatus
{
    /// <summary>Entrepreneur submitted a certification request — awaiting moderator review.</summary>
    public const string Pending = "Pending";
    /// <summary>Approved by Admin/Authority — valid and publicly visible.</summary>
    public const string Approved = "Approved";
    /// <summary>Rejected by Admin/Authority.</summary>
    public const string Rejected = "Rejected";
    public const string Active = "Active";
    public const string Expired = "Expired";
    public const string Suspended = "Suspended";
    public const string Revoked = "Revoked";

    public static readonly string[] All = { Pending, Approved, Rejected, Active, Expired, Suspended, Revoked };

    public static bool IsValid(string status) => All.Contains(status);
}
