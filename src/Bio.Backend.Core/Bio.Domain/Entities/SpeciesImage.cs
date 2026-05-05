namespace Bio.Domain.Entities;

/// <summary>
/// Represents an image associated with a species in the biodiversity catalog.
/// Observations uploaded by users include structured contextual data (geolocation,
/// device info, source type, CNN confidence) encoded as JSONB in the Metadata field.
/// No additional columns are needed — the existing schema accommodates all data.
/// </summary>
public class SpeciesImage
{
    public Guid Id { get; private set; }
    public Guid SpeciesId { get; private set; }
    public Guid? UploaderUserId { get; private set; }

    /// <summary>
    /// Full public URL of the image in S3. The filename (e.g. mobile_20260419174010123.jpg)
    /// is embedded in this URL and does not require a separate DB column.
    /// </summary>
    public string ImageUrl { get; private set; } = string.Empty;

    public string? ThumbnailUrl { get; private set; }

    /// <summary>
    /// JSONB field containing structured observation metadata:
    /// source_type, device, device_type, os, latitude, longitude,
    /// location_denied, species_predicted, confidence_score, model_version.
    /// </summary>
    public string? Metadata { get; private set; }

    public bool IsPrimary { get; private set; } = false;
    public bool IsValidatedByExpert { get; private set; } = false;
    public Guid? ValidatedByUserId { get; private set; }
    public DateTime? ValidationDate { get; private set; }
    public string LicenseType { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public Species Species { get; private set; } = null!;

    // ── EF Core ──────────────────────────────────────────────────────────────
    private SpeciesImage() { }

    // ── Legacy constructor (kept for backward compatibility) ─────────────────
    public SpeciesImage(Guid speciesId, string imageUrl)
    {
        Id = Guid.NewGuid();
        SpeciesId = speciesId;
        ImageUrl = imageUrl;
        LicenseType = "CC-BY";
    }

    // ── Factory — User Observation ────────────────────────────────────────────

    /// <summary>
    /// Creates a new <see cref="SpeciesImage"/> record representing a user-contributed
    /// observation. All contextual data (source, geolocation, device, AI result) is
    /// encoded in the <paramref name="metadataJson"/> JSONB field.
    /// </summary>
    /// <param name="speciesId">ID of the identified species.</param>
    /// <param name="imageUrl">Public S3 URL of the uploaded image.</param>
    /// <param name="uploaderUserId">ID of the authenticated user who contributed.</param>
    /// <param name="metadataJson">
    /// Structured JSON containing: source_type, device, latitude, longitude,
    /// location_denied, confidence_score, model_version, etc.
    /// </param>
    /// <param name="licenseType">License under which the image is shared (e.g. CC-BY).</param>
    /// <returns>A fully initialized, not-yet-persisted <see cref="SpeciesImage"/>.</returns>
    public static SpeciesImage CreateObservation(
        Guid speciesId,
        string imageUrl,
        Guid? uploaderUserId,
        string metadataJson,
        string licenseType)
    {
        return new SpeciesImage
        {
            Id = Guid.NewGuid(),
            SpeciesId = speciesId,
            ImageUrl = imageUrl,
            UploaderUserId = uploaderUserId,
            Metadata = metadataJson,
            LicenseType = licenseType,
            IsPrimary = false,
            IsValidatedByExpert = false,
            CreatedAt = DateTime.UtcNow,
        };
    }
}
