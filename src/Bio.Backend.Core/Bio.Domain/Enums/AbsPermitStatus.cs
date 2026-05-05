namespace Bio.Domain.Enums;

/// <summary>
/// Status values for ABS (Access and Benefit Sharing) permits.
/// </summary>
public static class AbsPermitStatus
{
    public const string Active = "Active";
    public const string Expired = "Expired";
    public const string Suspended = "Suspended";

    public static readonly string[] All = { Active, Expired, Suspended };

    public static bool IsValid(string status) => All.Contains(status);
}
