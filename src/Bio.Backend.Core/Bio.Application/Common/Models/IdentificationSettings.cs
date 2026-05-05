namespace Bio.Application.Common.Models;

/// <summary>
/// Configuration settings for species identification behavior.
/// Bound from the "IdentificationSettings" section in appsettings.json.
/// </summary>
public class IdentificationSettings
{
    /// <summary>Configuration section key in appsettings.json.</summary>
    public const string SectionName = "IdentificationSettings";

    /// <summary>
    /// Minimum CNN confidence score (0.0–1.0) required to allow a user to
    /// submit an observation for a predicted species.
    /// Defaults to 0.60 (60%) if not configured.
    /// </summary>
    public double MinConfidenceThreshold { get; init; } = 0.60;
}
