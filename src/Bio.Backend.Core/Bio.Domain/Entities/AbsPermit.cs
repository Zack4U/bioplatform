namespace Bio.Domain.Entities;

/// <summary>
/// ABS (Access and Benefit Sharing) permit for genetic resource access.
/// Compliance with Decision 391 / Nagoya Protocol.
/// Table: AbsPermits (SQL Server).
/// </summary>
public class AbsPermit
{
    public Guid Id { get; private set; }
    public Guid EntrepreneurId { get; private set; }
    public Guid SpeciesId { get; private set; } // Logical FK to PostgreSQL
    public string ResolutionNumber { get; private set; } = string.Empty;
    public DateTime EmissionDate { get; private set; }
    public DateTime ExpirationDate { get; private set; }
    public string GrantingAuthority { get; private set; } = string.Empty;
    public string Status { get; private set; } = "Active";
    public string? LegalFramework { get; private set; }

    // Navigation property
    public User Entrepreneur { get; private set; } = null!;

    private AbsPermit() { }

    public AbsPermit(
        Guid entrepreneurId,
        Guid speciesId,
        string resolutionNumber,
        DateTime emissionDate,
        DateTime expirationDate,
        string grantingAuthority,
        string? legalFramework = null)
    {
        Id = Guid.NewGuid();
        EntrepreneurId = entrepreneurId;
        SpeciesId = speciesId;
        ResolutionNumber = resolutionNumber;
        EmissionDate = emissionDate;
        ExpirationDate = expirationDate;
        GrantingAuthority = grantingAuthority;
        LegalFramework = legalFramework;
    }

    /// <summary>
    /// Updates mutable permit fields.
    /// </summary>
    public void Update(
        DateTime? expirationDate,
        string? grantingAuthority,
        string? legalFramework)
    {
        if (expirationDate.HasValue) ExpirationDate = expirationDate.Value;
        if (grantingAuthority != null) GrantingAuthority = grantingAuthority;
        if (legalFramework != null) LegalFramework = legalFramework;
    }

    /// <summary>
    /// Updates the permit status (Active, Expired, Suspended).
    /// </summary>
    public void UpdateStatus(string newStatus)
    {
        if (string.IsNullOrWhiteSpace(newStatus))
            throw new ArgumentException("Status cannot be empty.", nameof(newStatus));
        Status = newStatus;
    }

    /// <summary>
    /// Checks if the permit is currently active and not expired.
    /// </summary>
    public bool IsActiveAndValid() => Status == "Active" && ExpirationDate > DateTime.UtcNow;
}
