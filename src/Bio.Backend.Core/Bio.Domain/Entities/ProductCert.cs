namespace Bio.Domain.Entities;

public class ProductCert
{
    public Guid ProductId { get; private set; }
    public Guid CertId { get; private set; }
    public DateTime? ValidUntil { get; private set; }
    public string? VerificationCode { get; private set; }

    public Product Product { get; private set; } = null!;
    public SustainabilityCert Cert { get; private set; } = null!;

    private ProductCert() { }

    public ProductCert(Guid productId, Guid certId)
    {
        ProductId = productId;
        CertId = certId;
    }
}
