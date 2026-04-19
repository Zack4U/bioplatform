namespace Bio.Application.DTOs;

/// <summary>
/// DTO de respuesta para las imágenes de una especie.
/// Proyección ligera de la entidad SpeciesImage.
/// </summary>
public record SpeciesImageDTO(
    Guid Id,
    Guid SpeciesId,
    string ImageUrl,
    string? ThumbnailUrl,
    bool IsPrimary,
    bool IsValidatedByExpert,
    string LicenseType,
    DateTime CreatedAt
);
