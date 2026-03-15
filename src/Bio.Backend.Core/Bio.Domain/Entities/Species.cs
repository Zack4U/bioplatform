namespace Bio.Domain.Entities;

/// <summary>
/// Especie del catálogo de biodiversidad.
/// Tabla: species (PostgreSQL).
/// </summary>
public class Species
{
    public Guid Id { get; private set; }
    public int? TaxonomyId { get; private set; }
    public string Slug { get; private set; } = string.Empty;
    public string? ThumbnailUrl { get; private set; }
    public string ScientificName { get; private set; } = string.Empty;
    public string? CommonName { get; private set; }
    public string? Description { get; private set; }
    public string? EcologicalInfo { get; private set; }
    public string? TraditionalUses { get; private set; }
    public string? EconomicPotential { get; private set; }
    public string? ConservationStatus { get; private set; }
    public bool IsSensitive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public Taxonomy? Taxonomy { get; private set; }
    public ICollection<GeographicDistribution> GeographicDistributions { get; private set; } = new List<GeographicDistribution>();

    private Species() { }

    public Species(
        Guid id,
        string slug,
        string scientificName,
        int? taxonomyId = null,
        string? thumbnailUrl = null,
        string? commonName = null,
        string? description = null,
        string? ecologicalInfo = null,
        string? traditionalUses = null,
        string? economicPotential = null,
        string? conservationStatus = null,
        bool isSensitive = false)
    {
        Id = id;
        TaxonomyId = taxonomyId;
        Slug = slug;
        ThumbnailUrl = thumbnailUrl;
        ScientificName = scientificName;
        CommonName = commonName;
        Description = description;
        EcologicalInfo = ecologicalInfo;
        TraditionalUses = traditionalUses;
        EconomicPotential = economicPotential;
        ConservationStatus = conservationStatus;
        IsSensitive = isSensitive;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(
        string? slug,
        string? thumbnailUrl,
        string? commonName,
        string? description,
        string? ecologicalInfo,
        string? traditionalUses,
        string? economicPotential,
        string? conservationStatus,
        bool? isSensitive,
        int? taxonomyId)
    {
        if (slug != null) Slug = slug;
        if (thumbnailUrl != null) ThumbnailUrl = thumbnailUrl;
        if (commonName != null) CommonName = commonName;
        if (description != null) Description = description;
        if (ecologicalInfo != null) EcologicalInfo = ecologicalInfo;
        if (traditionalUses != null) TraditionalUses = traditionalUses;
        if (economicPotential != null) EconomicPotential = economicPotential;
        if (conservationStatus != null) ConservationStatus = conservationStatus;
        if (isSensitive.HasValue) IsSensitive = isSensitive.Value;
        if (taxonomyId.HasValue) TaxonomyId = taxonomyId;
        UpdatedAt = DateTime.UtcNow;
    }
}
