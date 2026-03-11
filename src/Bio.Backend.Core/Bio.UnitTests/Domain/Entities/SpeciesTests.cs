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
            // Act
            var species = new Species(ValidScientificName);

            // Assert
            species.Id.Should().NotBeEmpty();
            species.ScientificName.Should().Be(ValidScientificName);
            species.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            species.IsSensitive.Should().BeFalse();
            species.Slug.Should().BeEmpty();
        }

        /// <summary>
        /// Verifies that optional properties can be set.
        /// </summary>
        [Fact]
        public void ShouldHaveNullOptionalProperties_WhenCreatedWithNameOnly()
        {
            // Arrange
            var species = new Species(ValidScientificName);

            // Assert - optional properties default to null when not set
            species.CommonName.Should().BeNull();
            species.Description.Should().BeNull();
            species.ConservationStatus.Should().BeNull();
        }
    }
}
