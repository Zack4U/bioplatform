namespace Bio.Domain.Entities;

public class GeographicDistribution
{
    public Guid Id { get; private set; }
    public Guid SpeciesId { get; private set; }
    public string Municipality { get; private set; } = string.Empty;
    public string? Vereda { get; private set; }
    // We will use Geography types here, requires NetTopologySuite in EF Core
    // For now we map it as Point or generic object. Let's use NetTopologySuite.Geometries.Point
    public NetTopologySuite.Geometries.Point? LocationPoint { get; private set; }
    public double? Altitude { get; private set; }
    public DateTime? ObservationDate { get; private set; }
    public Guid? ObserverUserId { get; private set; }
    public string? Notes { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public Species Species { get; private set; } = null!;

    private GeographicDistribution() { }

    public GeographicDistribution(Guid speciesId, string municipality)
    {
        Id = Guid.NewGuid();
        SpeciesId = speciesId;
        Municipality = municipality;
    }
}
