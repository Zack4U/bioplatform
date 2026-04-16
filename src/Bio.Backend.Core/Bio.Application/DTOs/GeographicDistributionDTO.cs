namespace Bio.Application.DTOs;

/// <summary>
/// DTO de respuesta para distribución geográfica.
/// Las coordenadas se enmascaran si la especie es sensible
/// y el usuario no tiene rol privilegiado.
/// </summary>
public record GeographicDistributionDTO(
    Guid Id,
    Guid SpeciesId,
    double? Latitude,
    double? Longitude,
    double? Altitude,
    string? Municipality,
    string? EcosystemType,
    /// <summary>
    /// True si las coordenadas exactas fueron enmascaradas
    /// por protección de especie sensible.
    /// </summary>
    bool IsMasked
);
