namespace Bio.Domain.Entities;

/// <summary>
/// Uso tradicional de una especie (catálogo científico PostgreSQL).
/// Tabla: species_traditional_uses.
/// Una especie puede tener múltiples usos tradicionales documentados.
/// </summary>
public class SpeciesTraditionalUse
{
    public Guid Id { get; private set; }
    public Guid SpeciesId { get; private set; }

    /// <summary>Parte de la especie utilizada (ej: "Hojas", "Corteza", "Fruto").</summary>
    public string Part { get; private set; } = string.Empty;

    /// <summary>Categorías de uso: "Medicinal", "Alimentario", "Artesanal", etc.</summary>
    public string[] Category { get; private set; } = Array.Empty<string>();

    /// <summary>Propósito específico del uso (ej: "Cicatrización de heridas").</summary>
    public string? SpecificPurpose { get; private set; }

    /// <summary>Método de preparación o uso (ej: "Infusión", "Cataplasma").</summary>
    public string? PreparationMethod { get; private set; }

    /// <summary>Descripción detallada del uso tradicional.</summary>
    public string? Description { get; private set; }

    /// <summary>Comunidad o región de uso (ej: "Uso generalizado regional").</summary>
    public string? Community { get; private set; }

    /// <summary>Advertencias de uso tradicional (ej: toxicidad, contraindicaciones).</summary>
    public string? TraditionalWarnings { get; private set; }

    /// <summary>Confianza del dato generado: "low", "medium", "high".</summary>
    public string Confidence { get; private set; } = string.Empty;

    public DateTime CreatedAt { get; private set; }

    // Navigation
    public Species? Species { get; private set; }

    private SpeciesTraditionalUse() { }

    public SpeciesTraditionalUse(
        Guid speciesId,
        string part,
        string[] category,
        string? specificPurpose,
        string? preparationMethod,
        string? description,
        string? community,
        string? traditionalWarnings,
        string confidence)
    {
        Id = Guid.NewGuid();
        SpeciesId = speciesId;
        Part = part;
        Category = category;
        SpecificPurpose = specificPurpose;
        PreparationMethod = preparationMethod;
        Description = description;
        Community = community;
        TraditionalWarnings = traditionalWarnings;
        Confidence = confidence;
        CreatedAt = DateTime.UtcNow;
    }
}
