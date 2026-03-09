namespace Bio.Domain.Entities;

public class Certification
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string CertificationType { get; private set; } = string.Empty;
    public string CertificationBody { get; private set; } = string.Empty;
    public string? CertificateNumber { get; private set; }
    public DateTime IssueDate { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public string? DocumentUrl { get; private set; }
    public string Status { get; private set; } = "Active";
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public Product Product { get; private set; } = null!;

    private Certification() { }

    public Certification(Guid productId, string certificationType, string certificationBody, DateTime issueDate)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        CertificationType = certificationType;
        CertificationBody = certificationBody;
        IssueDate = issueDate;
    }
}
