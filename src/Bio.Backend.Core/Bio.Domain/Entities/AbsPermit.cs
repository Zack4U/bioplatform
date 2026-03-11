namespace Bio.Domain.Entities;

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

    public User Entrepreneur { get; private set; } = null!;

    private AbsPermit() { }

    public AbsPermit(Guid entrepreneurId, Guid speciesId, string resolutionNumber, DateTime emissionDate, DateTime expirationDate, string grantingAuthority)
    {
        Id = Guid.NewGuid();
        EntrepreneurId = entrepreneurId;
        SpeciesId = speciesId;
        ResolutionNumber = resolutionNumber;
        EmissionDate = emissionDate;
        ExpirationDate = expirationDate;
        GrantingAuthority = grantingAuthority;
    }
}
