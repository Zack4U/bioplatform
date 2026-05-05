namespace Bio.Domain.Entities;

/// <summary>
/// Unified certification for products. Covers sustainability certifications,
/// organic certifications, quality standards, and ABS compliance documents.
/// All supporting documents are stored as URLs.
/// Table: Certifications (SQL Server).
/// </summary>
public class Certification
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string CertificationType { get; private set; } = string.Empty;
    public string IssuingBody { get; private set; } = string.Empty;
    public string? CertificateNumber { get; private set; }
    public DateTime IssuedAt { get; private set; }
    public DateTime? ExpiresAt { get; private set; }
    public string Status { get; private set; } = "Active";
    public string? DocumentUrl { get; private set; }
    public string? LogoUrl { get; private set; }
    public string? VerificationCode { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    public Product Product { get; private set; } = null!;

    private Certification() { }

    public Certification(
        Guid productId,
        string name,
        string certificationType,
        string issuingBody,
        DateTime issuedAt,
        string? certificateNumber = null,
        DateTime? expiresAt = null,
        string? documentUrl = null,
        string? logoUrl = null,
        string? verificationCode = null)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        Name = name;
        CertificationType = certificationType;
        IssuingBody = issuingBody;
        IssuedAt = issuedAt;
        CertificateNumber = certificateNumber;
        ExpiresAt = expiresAt;
        DocumentUrl = documentUrl;
        LogoUrl = logoUrl;
        VerificationCode = verificationCode;
    }

    public void Update(
        string? name,
        string? certificationType,
        string? issuingBody,
        string? certificateNumber,
        DateTime? expiresAt,
        string? status,
        string? documentUrl,
        string? logoUrl,
        string? verificationCode)
    {
        if (name != null) Name = name;
        if (certificationType != null) CertificationType = certificationType;
        if (issuingBody != null) IssuingBody = issuingBody;
        if (certificateNumber != null) CertificateNumber = certificateNumber;
        if (expiresAt.HasValue) ExpiresAt = expiresAt;
        if (status != null) Status = status;
        if (documentUrl != null) DocumentUrl = documentUrl;
        if (logoUrl != null) LogoUrl = logoUrl;
        if (verificationCode != null) VerificationCode = verificationCode;
        UpdatedAt = DateTime.UtcNow;
    }
}
