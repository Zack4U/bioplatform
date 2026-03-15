namespace Bio.Domain.Entities;

/// <summary>
/// Taxonomía (reino, filo, clase, orden, familia, género).
/// Tabla: taxonomy (PostgreSQL).
/// </summary>
public class Taxonomy
{
    public int Id { get; private set; }
    public string? Kingdom { get; private set; }
    public string? Phylum { get; private set; }
    public string? ClassName { get; private set; }
    /// <summary>Orden taxonómico (mapeado a order_name en BD).</summary>
    public string? OrderName { get; private set; }
    public string? Family { get; private set; }
    public string? Genus { get; private set; }

    public ICollection<Species> Species { get; private set; } = new List<Species>();

    private Taxonomy() { }

    public Taxonomy(string? kingdom, string? phylum, string? className, string? orderName, string? family, string? genus)
    {
        Kingdom = kingdom;
        Phylum = phylum;
        ClassName = className;
        OrderName = orderName;
        Family = family;
        Genus = genus;
    }

    public void Update(string? kingdom, string? phylum, string? className, string? orderName, string? family, string? genus)
    {
        Kingdom = kingdom ?? Kingdom;
        Phylum = phylum ?? Phylum;
        ClassName = className ?? ClassName;
        OrderName = orderName ?? OrderName;
        Family = family ?? Family;
        Genus = genus ?? Genus;
    }
}
