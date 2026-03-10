using System;

namespace Bio.Application.DTOs;

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
    public string Description { get; set; } = string.Empty;
    public string ConservationStatus { get; set; } = string.Empty;
    public string? TraditionalUses { get; set; }
    public bool IsSensitive { get; set; } = false;
    public string ThumbnailUrl { get; set; } = string.Empty;

}
