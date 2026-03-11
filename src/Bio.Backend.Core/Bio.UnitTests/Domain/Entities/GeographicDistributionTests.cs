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
            // Act
            var distribution = new GeographicDistribution(SpeciesId, Municipality);

            // Assert
            distribution.Id.Should().NotBeEmpty();
            distribution.SpeciesId.Should().Be(SpeciesId);
            distribution.Municipality.Should().Be(Municipality);
            distribution.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }
    }
}
