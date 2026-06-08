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
    /// <summary>S3 URL of the official PDF document for this permit. Optional.</summary>
    public string? DocumentUrl { get; private set; }

    // ─── Request workflow (Pending → Active/Rejected) ──────────────────────
    /// <summary>When the entrepreneur submitted the access request.</summary>
    public DateTime RequestedAt { get; private set; }
    /// <summary>Entrepreneur's justification for requesting access to this species' genetic resources.</summary>
    public string? Justification { get; private set; }
    public Guid? ApprovedById { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    /// <summary>Reason given by the reviewing authority when rejecting a request.</summary>
    public string? RejectionReason { get; private set; }

    // Navigation properties
    public User Entrepreneur { get; private set; } = null!;
    public User? ApprovedBy { get; private set; }


    private AbsPermit() { }

    public AbsPermit(
        Guid entrepreneurId,
        Guid speciesId,
        string resolutionNumber,
        DateTime emissionDate,
        DateTime expirationDate,
        string grantingAuthority,
        string? legalFramework = null,
        string? documentUrl = null)
    {
        Id = Guid.NewGuid();
        EntrepreneurId = entrepreneurId;
        SpeciesId = speciesId;
        ResolutionNumber = resolutionNumber;
        EmissionDate = emissionDate;
        ExpirationDate = expirationDate;
        GrantingAuthority = grantingAuthority;
        LegalFramework = legalFramework;
        DocumentUrl = documentUrl;
        RequestedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Creates a Pending access request submitted by an entrepreneur.
    /// Legal permit fields (resolution, dates, authority) are filled in on approval.
    /// </summary>
    public static AbsPermit CreateRequest(Guid entrepreneurId, Guid speciesId, string? justification)
    {
        var now = DateTime.UtcNow;
        return new AbsPermit
        {
            Id = Guid.NewGuid(),
            EntrepreneurId = entrepreneurId,
            SpeciesId = speciesId,
            Status = "Pending",
            RequestedAt = now,
            Justification = justification,
            ResolutionNumber = string.Empty,
            GrantingAuthority = string.Empty,
            EmissionDate = now,
            ExpirationDate = now,
        };
    }

    /// <summary>
    /// Approves a Pending request: assigns the official resolution data and activates the permit.
    /// </summary>
    public void Approve(
        Guid approvedById,
        string resolutionNumber,
        DateTime emissionDate,
        DateTime expirationDate,
        string grantingAuthority,
        string? legalFramework,
        string? documentUrl)
    {
        Status = "Active";
        ResolutionNumber = resolutionNumber;
        EmissionDate = emissionDate;
        ExpirationDate = expirationDate;
        GrantingAuthority = grantingAuthority;
        LegalFramework = legalFramework;
        DocumentUrl = documentUrl;
        ApprovedById = approvedById;
        ApprovedAt = DateTime.UtcNow;
        RejectionReason = null;
    }

    /// <summary>
    /// Rejects a Pending request with a documented reason.
    /// </summary>
    public void Reject(Guid approvedById, string reason)
    {
        Status = "Rejected";
        ApprovedById = approvedById;
        ApprovedAt = DateTime.UtcNow;
        RejectionReason = reason;
    }


    /// <summary>
    /// Updates mutable permit fields.
    /// </summary>
    public void Update(
        DateTime? expirationDate,
        string? grantingAuthority,
        string? legalFramework,
        string? documentUrl = null)
    {
        if (expirationDate.HasValue) ExpirationDate = expirationDate.Value;
        if (grantingAuthority != null) GrantingAuthority = grantingAuthority;
        if (legalFramework != null) LegalFramework = legalFramework;
        if (documentUrl != null) DocumentUrl = documentUrl;
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
