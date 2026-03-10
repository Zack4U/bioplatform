namespace Bio.Domain.Entities;

public class Species
{
    public Guid Id { get; private set; }
    public int? TaxonomyId { get; private set; }
    public string Slug { get; private set; } = string.Empty;
    public string ScientificName { get; private set; } = string.Empty;
    public List<string> CommonNames { get; private set; } = new();
    public string? Description { get; private set; }
    public string? EcologicalInfo { get; private set; }
    public string? TraditionalUses { get; private set; }
    public string? EconomicPotential { get; private set; }
    public string? ConservationStatus { get; private set; }
    public bool IsSensitive { get; private set; } = false;
    public string? ThumbnailUrl { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    public Taxonomy? Taxonomy { get; private set; }

    private Species() { }

    public Species(string scientificName)
    {
        Id = Guid.NewGuid();
        ScientificName = scientificName;
    }
}
