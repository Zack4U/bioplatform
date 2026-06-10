namespace Bio.Domain.Constants;

/// <summary>
/// Constants related to species observation uploads.
/// Centralizes all magic strings and numbers for the upload feature.
/// </summary>
public static class ObservationConstants
{
    // ── Source Types ──────────────────────────────────────────────────────────

    /// <summary>Observation uploaded from a mobile application.</summary>
    public const string SourceMobile = "Mobile";

    /// <summary>Observation uploaded from the web application.</summary>
    public const string SourceWeb = "Web";

    /// <summary>All valid source type values.</summary>
    public static readonly IReadOnlyList<string> ValidSourceTypes =
        [SourceMobile, SourceWeb];

    // ── File Upload Constraints ────────────────────────────────────────────────

    /// <summary>Maximum allowed file size for observation images (10 MB).</summary>
    public const long MaxFileSizeBytes = 10L * 1024L * 1024L;

    /// <summary>Allowed MIME content types for observation images.</summary>
    public static readonly IReadOnlyList<string> AllowedContentTypes =
        ["image/jpeg", "image/png", "image/webp"];

    // ── S3 Storage ────────────────────────────────────────────────────────────

    /// <summary>Base path prefix inside the S3 bucket for species images.</summary>
    public const string S3SpeciesImagesBasePath = "assets/images/species";

    /// <summary>Base path prefix inside the S3 bucket for product images.</summary>
    public const string S3ProductImagesBasePath = "assets/images/products";

    // ── File Name Prefixes ────────────────────────────────────────────────────

    /// <summary>Filename prefix for observations uploaded from mobile.</summary>
    public const string FileNamePrefixMobile = "mobile";

    /// <summary>Filename prefix for observations uploaded from the web.</summary>
    public const string FileNamePrefixWeb = "web";

    // ── Default License ───────────────────────────────────────────────────────

    /// <summary>Default license type applied when none is specified.</summary>
    public const string DefaultLicenseType = "CC-BY";

    // ── Metadata Keys ─────────────────────────────────────────────────────────

    /// <summary>JSON key for the source type field inside the metadata JSONB.</summary>
    public const string MetadataKeySourceType = "source_type";

    /// <summary>JSON key for the device name inside the metadata JSONB.</summary>
    public const string MetadataKeyDevice = "device";

    /// <summary>JSON key for the device type inside the metadata JSONB.</summary>
    public const string MetadataKeyDeviceType = "device_type";

    /// <summary>JSON key for the OS inside the metadata JSONB.</summary>
    public const string MetadataKeyOperatingSystem = "os";

    /// <summary>JSON key for latitude inside the metadata JSONB.</summary>
    public const string MetadataKeyLatitude = "latitude";

    /// <summary>JSON key for longitude inside the metadata JSONB.</summary>
    public const string MetadataKeyLongitude = "longitude";

    /// <summary>JSON key indicating geolocation was explicitly denied by the user.</summary>
    public const string MetadataKeyLocationDenied = "location_denied";

    /// <summary>JSON key for the predicted species name inside the metadata JSONB.</summary>
    public const string MetadataKeySpeciesPredicted = "species_predicted";

    /// <summary>JSON key for the CNN confidence score inside the metadata JSONB.</summary>
    public const string MetadataKeyConfidenceScore = "confidence_score";

    /// <summary>JSON key for the AI model version inside the metadata JSONB.</summary>
    public const string MetadataKeyModelVersion = "model_version";
}
