namespace Bio.Domain.Entities;

public class Taxonomy
{
    public int Id { get; private set; }
    public string Kingdom { get; private set; } = string.Empty;
    public string? Phylum { get; private set; }
    public string? ClassName { get; private set; }
    public string? Order { get; private set; }
    public string? Family { get; private set; }
    public string Genus { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    public ICollection<Species> Species { get; private set; } = new List<Species>();

    private Taxonomy() { }

    public Taxonomy(string kingdom, string genus)
    {
        Kingdom = kingdom;
        Genus = genus;
    }
}
