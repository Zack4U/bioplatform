using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Bio.UnitTests.Infrastructure.Persistence;

/// <summary>
/// Unit tests for the <see cref="ScientificDbContext"/> configuration.
/// </summary>
public class ScientificDbContextTests
{
    private readonly ScientificDbContext _context;

    public ScientificDbContextTests()
    {
        var options = new DbContextOptionsBuilder<ScientificDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ScientificDbContext(options);
    }

    /// <summary>
    /// Tests for the Species entity configuration in the database model.
    /// </summary>
    public class SpeciesConfiguration : ScientificDbContextTests
    {
        [Fact]
        public void ShouldHavePrimaryKey()
        {
            var entity = _context.Model.FindEntityType(typeof(Species));
            var primaryKey = entity?.FindPrimaryKey();

            primaryKey.Should().NotBeNull();
            primaryKey!.Properties.Should().ContainSingle(p => p.Name == "Id");
        }

        [Fact]
        public void ScientificName_ShouldBeUnique()
        {
            var entity = _context.Model.FindEntityType(typeof(Species));
            var index = entity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Species.ScientificName)));

            index.Should().NotBeNull();
            index!.IsUnique.Should().BeTrue();
        }

        [Fact]
        public void ShouldHaveForeignKeyToTaxonomy()
        {
            var entity = _context.Model.FindEntityType(typeof(Species));
            var fk = entity?.GetForeignKeys()
                .FirstOrDefault(f => f.PrincipalEntityType.ClrType == typeof(Taxonomy));

            fk.Should().NotBeNull();
        }
    }

    /// <summary>
    /// Tests for the Taxonomy entity configuration.
    /// </summary>
    public class TaxonomyConfiguration : ScientificDbContextTests
    {
        [Fact]
        public void ShouldHavePrimaryKey()
        {
            var entity = _context.Model.FindEntityType(typeof(Taxonomy));
            var primaryKey = entity?.FindPrimaryKey();

            primaryKey.Should().NotBeNull();
            primaryKey!.Properties.Should().ContainSingle(p => p.Name == "Id");
        }

        [Fact]
        public void Family_ShouldHaveIndex()
        {
            var entity = _context.Model.FindEntityType(typeof(Taxonomy));
            var index = entity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Taxonomy.Family)));

            index.Should().NotBeNull();
        }

        [Fact]
        public void Genus_ShouldHaveIndex()
        {
            var entity = _context.Model.FindEntityType(typeof(Taxonomy));
            var index = entity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Taxonomy.Genus)));

            index.Should().NotBeNull();
        }
    }

    /// <summary>
    /// Tests for the GeographicDistribution entity configuration.
    /// </summary>
    public class GeographicDistributionConfiguration : ScientificDbContextTests
    {
        [Fact]
        public void ShouldHavePrimaryKey()
        {
            var entity = _context.Model.FindEntityType(typeof(GeographicDistribution));
            var primaryKey = entity?.FindPrimaryKey();

            primaryKey.Should().NotBeNull();
            primaryKey!.Properties.Should().ContainSingle(p => p.Name == "Id");
        }

        [Fact]
        public void ShouldHaveForeignKeyToSpecies()
        {
            var entity = _context.Model.FindEntityType(typeof(GeographicDistribution));
            var fk = entity?.GetForeignKeys()
                .FirstOrDefault(f => f.PrincipalEntityType.ClrType == typeof(Species));

            fk.Should().NotBeNull();
        }
    }

    /// <summary>
    /// Tests for the SpeciesImage entity configuration.
    /// </summary>
    public class SpeciesImageConfiguration : ScientificDbContextTests
    {
        [Fact]
        public void ShouldHavePrimaryKey()
        {
            var entity = _context.Model.FindEntityType(typeof(SpeciesImage));
            var primaryKey = entity?.FindPrimaryKey();

            primaryKey.Should().NotBeNull();
            primaryKey!.Properties.Should().ContainSingle(p => p.Name == "Id");
        }

        [Fact]
        public void ShouldHaveForeignKeyToSpecies()
        {
            var entity = _context.Model.FindEntityType(typeof(SpeciesImage));
            var fk = entity?.GetForeignKeys()
                .FirstOrDefault(f => f.PrincipalEntityType.ClrType == typeof(Species));

            fk.Should().NotBeNull();
        }
    }

    /// <summary>
    /// Tests for the BusinessPlan entity configuration.
    /// </summary>
    public class BusinessPlanConfiguration : ScientificDbContextTests
    {
        [Fact]
        public void ShouldHavePrimaryKey()
        {
            var entity = _context.Model.FindEntityType(typeof(BusinessPlan));
            var primaryKey = entity?.FindPrimaryKey();

            primaryKey.Should().NotBeNull();
            primaryKey!.Properties.Should().ContainSingle(p => p.Name == "Id");
        }

        [Fact]
        public void EntrepreneurId_ShouldHaveIndex()
        {
            var entity = _context.Model.FindEntityType(typeof(BusinessPlan));
            var index = entity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(BusinessPlan.EntrepreneurId)));

            index.Should().NotBeNull();
        }
    }

    /// <summary>
    /// Tests for ChatSession and ChatMessage entity configuration.
    /// </summary>
    public class ChatConfiguration : ScientificDbContextTests
    {
        [Fact]
        public void ChatSession_ShouldHavePrimaryKey()
        {
            var entity = _context.Model.FindEntityType(typeof(ChatSession));
            var primaryKey = entity?.FindPrimaryKey();

            primaryKey.Should().NotBeNull();
            primaryKey!.Properties.Should().ContainSingle(p => p.Name == "Id");
        }

        [Fact]
        public void ChatMessage_ShouldHaveForeignKeyToSession()
        {
            var entity = _context.Model.FindEntityType(typeof(ChatMessage));
            var fk = entity?.GetForeignKeys()
                .FirstOrDefault(f => f.PrincipalEntityType.ClrType == typeof(ChatSession));

            fk.Should().NotBeNull();
        }

        [Fact]
        public void ChatSession_UserId_ShouldHaveIndex()
        {
            var entity = _context.Model.FindEntityType(typeof(ChatSession));
            var index = entity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(ChatSession.UserId)));

            index.Should().NotBeNull();
        }
    }

    /// <summary>
    /// Tests for the RagDocument entity configuration.
    /// </summary>
    public class RagDocumentConfiguration : ScientificDbContextTests
    {
        [Fact]
        public void ShouldHavePrimaryKey()
        {
            var entity = _context.Model.FindEntityType(typeof(RagDocument));
            var primaryKey = entity?.FindPrimaryKey();

            primaryKey.Should().NotBeNull();
            primaryKey!.Properties.Should().ContainSingle(p => p.Name == "Id");
        }

        [Fact]
        public void ShouldHaveOptionalForeignKeyToSpecies()
        {
            var entity = _context.Model.FindEntityType(typeof(RagDocument));
            var fk = entity?.GetForeignKeys()
                .FirstOrDefault(f => f.PrincipalEntityType.ClrType == typeof(Species));

            fk.Should().NotBeNull();
            fk!.IsRequired.Should().BeFalse();
        }
    }

    /// <summary>
    /// Tests that verify DbSet properties are accessible.
    /// </summary>
    public class DbSet_Properties : ScientificDbContextTests
    {
        [Fact]
        public void Taxonomies_ShouldBeAccessible()
        {
            _context.Taxonomies.Should().NotBeNull();
        }

        [Fact]
        public void Species_ShouldBeAccessible()
        {
            _context.Species.Should().NotBeNull();
        }

        [Fact]
        public void GeographicDistributions_ShouldBeAccessible()
        {
            _context.GeographicDistributions.Should().NotBeNull();
        }

        [Fact]
        public void SpeciesImages_ShouldBeAccessible()
        {
            _context.SpeciesImages.Should().NotBeNull();
        }

        [Fact]
        public void PredictionLogs_ShouldBeAccessible()
        {
            _context.PredictionLogs.Should().NotBeNull();
        }

        [Fact]
        public void BusinessPlans_ShouldBeAccessible()
        {
            _context.BusinessPlans.Should().NotBeNull();
        }

        [Fact]
        public void ChatSessions_ShouldBeAccessible()
        {
            _context.ChatSessions.Should().NotBeNull();
        }

        [Fact]
        public void ChatMessages_ShouldBeAccessible()
        {
            _context.ChatMessages.Should().NotBeNull();
        }

        [Fact]
        public void RagDocuments_ShouldBeAccessible()
        {
            _context.RagDocuments.Should().NotBeNull();
        }
    }
}
