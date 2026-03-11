namespace Bio.Domain.Entities;

public class SpeciesImage
{
    public Guid Id { get; private set; }
    public Guid SpeciesId { get; private set; }
    public Guid? UploaderUserId { get; private set; }
    public string ImageUrl { get; private set; } = string.Empty;
    public string? ThumbnailUrl { get; private set; }
    public string? Metadata { get; private set; } // Map JSONB to string or JsonDocument
    public bool IsPrimary { get; private set; } = false;
    public bool IsValidatedByExpert { get; private set; } = false;
    public Guid? ValidatedByUserId { get; private set; }
    public DateTime? ValidationDate { get; private set; }
    public string LicenseType { get; private set; } = "CC-BY";
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public Species Species { get; private set; } = null!;

    private SpeciesImage() { }

    public SpeciesImage(Guid speciesId, string imageUrl)
    {
        Id = Guid.NewGuid();
        SpeciesId = speciesId;
        ImageUrl = imageUrl;
    }
}
