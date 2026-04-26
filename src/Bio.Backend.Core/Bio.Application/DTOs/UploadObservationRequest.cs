namespace Bio.Application.DTOs;

/// <summary>
/// Contextual fields for the "Contribuir Observación" endpoint, received as
/// multipart/form-data. The image file (IFormFile) is handled separately in the
/// Controller (API layer) to keep the Application layer free of ASP.NET Core types.
/// </summary>
public class UploadObservationRequest
{
    /// <summary>
    /// License under which the contributor shares this image.
    /// Examples: CC-BY, CC-BY-NC, CC-BY-SA, CC-BY-NC-SA.
    /// </summary>
    public string LicenseType { get; set; } = "CC-BY";

    /// <summary>
    /// Origin of the observation: "Mobile" or "Web".
    /// Used as the filename prefix (e.g. <c>mobile_20260419...</c>).
    /// </summary>
    public string SourceType { get; set; } = "Web";

    /// <summary>Device model name (e.g. "iPhone 15 Pro", "Samsung Galaxy S24").</summary>
    public string? Device { get; set; }

    /// <summary>Device form-factor (e.g. "smartphone", "tablet", "desktop").</summary>
    public string? DeviceType { get; set; }

    /// <summary>Operating system (e.g. "iOS 17.4", "Android 14", "Windows 11").</summary>
    public string? OperatingSystem { get; set; }

    /// <summary>GPS latitude. Null if the user denied geolocation permission.</summary>
    public double? Latitude { get; set; }

    /// <summary>GPS longitude. Null if the user denied geolocation permission.</summary>
    public double? Longitude { get; set; }

    /// <summary>Scientific name of the species as predicted by the CNN.</summary>
    public string? SpeciesPredicted { get; set; }

    /// <summary>CNN confidence score (0.0–1.0) for the top prediction.</summary>
    public double? ConfidenceScore { get; set; }

    /// <summary>Version identifier of the AI model that produced the prediction.</summary>
    public string? ModelVersion { get; set; }
}

