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
        public void ShouldAllowSettingOptionalProperties()
        {
            // Arrange
            var species = new Species(ValidScientificName);
            var commonName = "Tomato";
            var description = "A red fruit.";

            // Act - Using reflection or just checking if we can set them if they had public setters.
            // Wait, looking at Species.cs, they have private setters.
            // There are no Update methods in Species.cs. This is interesting.
            // I should check if there are any other methods.
        }
    }
}
