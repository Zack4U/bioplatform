using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="Species"/> domain entity.
/// </summary>
public class SpeciesTests
{
    private const string ValidScientificName = "Solanum lycopersicum";

    /// <summary>
    /// Tests for the initialization of the Species entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a Species is initialized with a new Id and the correct ScientificName.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act - constructor: id, slug, scientificName, taxonomyId?, thumbnailUrl?, commonName?, ...
            var id = Guid.NewGuid();
            var species = new Species(id, "solanum-lycopersicum", ValidScientificName);

            // Assert
            species.Id.Should().Be(id);
            species.ScientificName.Should().Be(ValidScientificName);
            species.Slug.Should().Be("solanum-lycopersicum");
            species.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            species.IsSensitive.Should().BeFalse();
        }

        /// <summary>
        /// Verifies that optional properties can be set.
        /// </summary>
        [Fact]
        public void ShouldHaveNullOptionalProperties_WhenCreatedWithNameOnly()
        {
            // Arrange - constructor requiere slug y scientificName
            var species = new Species(Guid.NewGuid(), "solanum-lycopersicum", ValidScientificName);

            // Assert - optional properties default to null when not set
            species.CommonName.Should().BeNull();
            species.Description.Should().BeNull();
            species.ConservationStatus.Should().BeNull();
        }
    }
}
