namespace Bio.Domain.Entities;

public class SustainabilityCert
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Issuer { get; private set; } = string.Empty;
    public string? LogoUrl { get; private set; }

    private SustainabilityCert() { }

    public SustainabilityCert(string name, string issuer)
    {
        Id = Guid.NewGuid();
        Name = name;
        Issuer = issuer;
    }
}
