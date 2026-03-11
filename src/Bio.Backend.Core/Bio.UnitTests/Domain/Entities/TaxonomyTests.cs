using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="Taxonomy"/> domain entity.
/// </summary>
public class TaxonomyTests
{
    private const string ValidKingdom = "Plantae";
    private const string ValidGenus = "Solanum";

    /// <summary>
    /// Tests for the initialization of the Taxonomy entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a Taxonomy is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var taxonomy = new Taxonomy(ValidKingdom, ValidGenus);

            // Assert
            taxonomy.Kingdom.Should().Be(ValidKingdom);
            taxonomy.Genus.Should().Be(ValidGenus);
            taxonomy.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            taxonomy.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            taxonomy.Species.Should().BeEmpty();
        }
    }
}
