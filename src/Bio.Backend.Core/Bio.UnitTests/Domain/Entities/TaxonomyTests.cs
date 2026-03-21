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
            // Act - constructor: kingdom, phylum, className, orderName, family, genus
            var taxonomy = new Taxonomy(ValidKingdom, "Magnoliophyta", "Magnoliopsida", "Solanales", "Solanaceae", ValidGenus);

            // Assert (Taxonomy ya no tiene CreatedAt/UpdatedAt; alineado al script PostgreSQL)
            taxonomy.Kingdom.Should().Be(ValidKingdom);
            taxonomy.Genus.Should().Be(ValidGenus);
            taxonomy.Species.Should().BeEmpty();
        }
    }
}
