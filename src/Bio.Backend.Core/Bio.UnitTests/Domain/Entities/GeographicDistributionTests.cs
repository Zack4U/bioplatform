using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="GeographicDistribution"/> domain entity.
/// </summary>
public class GeographicDistributionTests
{
    private static readonly Guid SpeciesId = Guid.NewGuid();
    private const string Municipality = "Medellín";

    /// <summary>
    /// Tests for the initialization of the GeographicDistribution entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a GeographicDistribution is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act - constructor: speciesId, latitude, longitude, altitude?, municipality?, ecosystemType?, locationPoint?
            var distribution = new GeographicDistribution(SpeciesId, 4.5, -75.5, null, Municipality, null, null);

            // Assert (GeographicDistribution alineado al script: sin CreatedAt)
            distribution.Id.Should().NotBeEmpty();
            distribution.SpeciesId.Should().Be(SpeciesId);
            distribution.Latitude.Should().Be(4.5);
            distribution.Longitude.Should().Be(-75.5);
            distribution.Municipality.Should().Be(Municipality);
        }
    }
}
