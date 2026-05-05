namespace Bio.Domain.Entities;

/// <summary>
/// Potencial económico de una especie (catálogo científico PostgreSQL).
/// Tabla: species_economic_potentials.
/// Una especie puede tener múltiples sectores de potencial económico.
/// </summary>
public class SpeciesEconomicPotential
{
    public Guid Id { get; private set; }
    public Guid SpeciesId { get; private set; }

    /// <summary>Sector de mercado (ej: "Cosmecéutica", "Ecoturismo").</summary>
    public string Sector { get; private set; } = string.Empty;

    /// <summary>Array de productos derivados de la especie.</summary>
    public string[] Products { get; private set; } = Array.Empty<string>();

    /// <summary>Propiedades activas (compuestos bioactivos, etc.). Puede ser null.</summary>
    public string[]? ActiveProperties { get; private set; }

    /// <summary>Descripción del potencial económico.</summary>
    public string? Description { get; private set; }

    /// <summary>Valor de mercado estimado: "Bajo", "Medio", "Alto", "Desconocido".</summary>
    public string MarketValue { get; private set; } = string.Empty;

    /// <summary>Nivel de sostenibilidad: "Bajo", "Medio", "Alto".</summary>
    public string SustainabilityLevel { get; private set; } = string.Empty;

    /// <summary>Confianza del dato generado: "low", "medium", "high".</summary>
    public string Confidence { get; private set; } = string.Empty;

    public DateTime CreatedAt { get; private set; }

    // Navigation
    public Species? Species { get; private set; }

    private SpeciesEconomicPotential() { }

    public SpeciesEconomicPotential(
        Guid speciesId,
        string sector,
        string[] products,
        string[]? activeProperties,
        string? description,
        string marketValue,
        string sustainabilityLevel,
        string confidence)
    {
        Id = Guid.NewGuid();
        SpeciesId = speciesId;
        Sector = sector;
        Products = products;
        ActiveProperties = activeProperties;
        Description = description;
        MarketValue = marketValue;
        SustainabilityLevel = sustainabilityLevel;
        Confidence = confidence;
        CreatedAt = DateTime.UtcNow;
    }
}
