namespace Bio.Application.DTOs;

/// <summary>
/// Mapeo de columnas del archivo CSV para la importación masiva de especies.
/// Columnas requeridas: Kingdom, Phylum, Class, Order, Family, Genus, ScientificName,
/// CommonName, Description, ConservationStatus, AltitudeRange, LegalStatus, IsSensitive, ThumbnailUrl.
/// Los datos de enriquecimiento (potencial económico y usos tradicionales) se importan por
/// endpoints separados (POST /api/species/import-economic-potential y /import-traditional-uses).
/// </summary>
public class SpeciesCsvRecord
{
    // Taxonomy Data
    public string Kingdom { get; set; } = string.Empty;
    public string Phylum { get; set; } = string.Empty;
    public string Class { get; set; } = string.Empty;
    public string Order { get; set; } = string.Empty;
    public string Family { get; set; } = string.Empty;
    public string Genus { get; set; } = string.Empty;

    // Species Data
    public string ScientificName { get; set; } = string.Empty;
    public string CommonName { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ConservationStatus { get; set; } = string.Empty;
    public string AltitudeRange { get; set; } = string.Empty;
    public bool LegalStatus { get; set; } = false;
    public bool IsSensitive { get; set; } = false;
    public string? EcologicalInfo { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
}
