namespace Bio.Domain.Entities;

/// <summary>
/// Distribución geográfica de una especie (punto con coordenadas).
/// Tabla: geographic_distribution (PostgreSQL). location_point GEOMETRY(Point, 4326).
/// </summary>
public class GeographicDistribution
{
    public Guid Id { get; private set; }
    public Guid SpeciesId { get; private set; }
    public double Latitude { get; private set; }
    public double Longitude { get; private set; }
    public double? Altitude { get; private set; }
    public string? Municipality { get; private set; }
    public string? EcosystemType { get; private set; }
    public NetTopologySuite.Geometries.Point? LocationPoint { get; private set; }

    public Species? Species { get; private set; }

    private GeographicDistribution() { }

    public GeographicDistribution(Guid speciesId, double latitude, double longitude, double? altitude = null, string? municipality = null, string? ecosystemType = null, NetTopologySuite.Geometries.Point? locationPoint = null)
    {
        Id = Guid.NewGuid();
        SpeciesId = speciesId;
        Latitude = latitude;
        Longitude = longitude;
        Altitude = altitude;
        Municipality = municipality;
        EcosystemType = ecosystemType;
        LocationPoint = locationPoint;
    }
}
