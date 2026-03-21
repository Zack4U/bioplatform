using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Bio.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Bio.UnitTests.Infrastructure.Services;

/// <summary>
/// Unit tests for <see cref="SpeciesImportJob"/> batch processing logic.
/// </summary>
public class SpeciesImportJobTests
{
    private readonly Mock<ILogger<SpeciesImportJob>> _loggerMock;
    private readonly Mock<ISpeciesRepository> _speciesRepoMock;
    private readonly Mock<ITaxonomyRepository> _taxonomyRepoMock;
    private readonly Mock<IScientificUnitOfWork> _uowMock;
    private readonly SpeciesImportJob _sut;

    public SpeciesImportJobTests()
    {
        _loggerMock = new Mock<ILogger<SpeciesImportJob>>();
        _speciesRepoMock = new Mock<ISpeciesRepository>();
        _taxonomyRepoMock = new Mock<ITaxonomyRepository>();
        _uowMock = new Mock<IScientificUnitOfWork>();

        _sut = new SpeciesImportJob(
            _loggerMock.Object,
            _speciesRepoMock.Object,
            _taxonomyRepoMock.Object,
            _uowMock.Object);
    }

    [Fact]
    public async Task ProcessBatchAsync_ValidBatch_InsertsSpeciesAndTaxonomy()
    {
        // Arrange
        var batch = new List<SpeciesCsvRecord>
        {
            new()
            {
                Kingdom = "Plantae",
                Phylum = "Tracheophyta",
                Class = "Magnoliopsida",
                Order = "Asparagales",
                Family = "Orchidaceae",
                Genus = "Cattleya",
                ScientificName = "Cattleya trianae",
                CommonName = "Flor de Mayo",
                Description = "Epífita con pseudobulbos",
                ConservationStatus = "VU",
                AltitudeRange = "1500-2800 msnm",
                IsSensitive = true
            }
        };

        // No existing species
        _speciesRepoMock
            .Setup(r => r.GetByScientificNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Species?)null);

        // No existing taxonomy
        _taxonomyRepoMock
            .Setup(r => r.GetByFieldsAsync(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Taxonomy?)null);

        // Taxonomy AddAsync returns a taxonomy with an Id
        _taxonomyRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Taxonomy>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Taxonomy t, CancellationToken _) => t);

        _uowMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var (processed, skipped) = await _sut.ProcessBatchAsync(batch, Guid.NewGuid());

        // Assert
        processed.Should().Be(1);
        skipped.Should().Be(0);

        _taxonomyRepoMock.Verify(r => r.AddAsync(It.IsAny<Taxonomy>(), It.IsAny<CancellationToken>()), Times.Once);
        _speciesRepoMock.Verify(r => r.AddRangeAsync(
            It.Is<IEnumerable<Species>>(list => list.Any()),
            It.IsAny<CancellationToken>()), Times.Once);
        // SaveChangesAsync called at least twice: once for taxonomy, once for species
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeast(2));
    }

    [Fact]
    public async Task ProcessBatchAsync_DuplicateScientificName_SkipsRecord()
    {
        // Arrange
        var batch = new List<SpeciesCsvRecord>
        {
            new() { ScientificName = "Cattleya trianae", Family = "Orchidaceae", Genus = "Cattleya" }
        };

        // Species already exists
        _speciesRepoMock
            .Setup(r => r.GetByScientificNameAsync("Cattleya trianae", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Species(Guid.NewGuid(), "cattleya-trianae", "Cattleya trianae"));

        // Act
        var (processed, skipped) = await _sut.ProcessBatchAsync(batch, Guid.NewGuid());

        // Assert
        processed.Should().Be(0);
        skipped.Should().Be(1);

        _speciesRepoMock.Verify(r => r.AddRangeAsync(It.IsAny<IEnumerable<Species>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessBatchAsync_EmptyScientificName_SkipsRecord()
    {
        // Arrange
        var batch = new List<SpeciesCsvRecord>
        {
            new() { ScientificName = "", Family = "Orchidaceae", Genus = "Cattleya" }
        };

        // Act
        var (processed, skipped) = await _sut.ProcessBatchAsync(batch, Guid.NewGuid());

        // Assert
        processed.Should().Be(0);
        skipped.Should().Be(1);
    }

    [Fact]
    public async Task ProcessBatchAsync_ExistingTaxonomy_ReusesTaxonomy()
    {
        // Arrange
        var existingTaxonomy = new Taxonomy("Plantae", "Tracheophyta", "Magnoliopsida", "Asparagales", "Orchidaceae", "Cattleya");

        var batch = new List<SpeciesCsvRecord>
        {
            new()
            {
                Kingdom = "Plantae",
                Phylum = "Tracheophyta",
                Class = "Magnoliopsida",
                Order = "Asparagales",
                Family = "Orchidaceae",
                Genus = "Cattleya",
                ScientificName = "Cattleya warscewiczii"
            }
        };

        _speciesRepoMock
            .Setup(r => r.GetByScientificNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Species?)null);

        _taxonomyRepoMock
            .Setup(r => r.GetByFieldsAsync("Plantae", "Tracheophyta", "Magnoliopsida", "Asparagales", "Orchidaceae", "Cattleya", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingTaxonomy);

        _uowMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var (processed, skipped) = await _sut.ProcessBatchAsync(batch, Guid.NewGuid());

        // Assert
        processed.Should().Be(1);
        skipped.Should().Be(0);

        // Taxonomy should NOT be created
        _taxonomyRepoMock.Verify(r => r.AddAsync(It.IsAny<Taxonomy>(), It.IsAny<CancellationToken>()), Times.Never);

        // Species should be added
        _speciesRepoMock.Verify(r => r.AddRangeAsync(
            It.Is<IEnumerable<Species>>(list => list.Any()),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("Cattleya trianae", "cattleya-trianae")]
    [InlineData("Quercus humboldtii", "quercus-humboldtii")]
    [InlineData("  Espeletia  hartwegiana  ", "espeletia-hartwegiana")]
    [InlineData("Vanilla planifolia", "vanilla-planifolia")]
    public void GenerateSlug_ScientificName_ReturnsExpectedSlug(string input, string expected)
    {
        // Act
        var slug = SpeciesImportJob.GenerateSlug(input);

        // Assert
        slug.Should().Be(expected);
    }

    [Fact]
    public async Task ProcessBatchAsync_MultipleMixedRecords_ProcessesValidAndSkipsDuplicates()
    {
        // Arrange
        var batch = new List<SpeciesCsvRecord>
        {
            new() { ScientificName = "Cattleya trianae", Family = "Orchidaceae", Genus = "Cattleya" },
            new() { ScientificName = "Quercus humboldtii", Family = "Fagaceae", Genus = "Quercus" },
            new() { ScientificName = "", Family = "Unknown", Genus = "Unknown" }
        };

        // First species exists, second does not
        _speciesRepoMock
            .Setup(r => r.GetByScientificNameAsync("Cattleya trianae", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Species(Guid.NewGuid(), "cattleya-trianae", "Cattleya trianae"));

        _speciesRepoMock
            .Setup(r => r.GetByScientificNameAsync("Quercus humboldtii", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Species?)null);

        _taxonomyRepoMock
            .Setup(r => r.GetByFieldsAsync(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Taxonomy?)null);

        _taxonomyRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Taxonomy>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Taxonomy t, CancellationToken _) => t);

        _uowMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var (processed, skipped) = await _sut.ProcessBatchAsync(batch, Guid.NewGuid());

        // Assert
        processed.Should().Be(1);  // Only Quercus humboldtii 
        skipped.Should().Be(2);    // Cattleya (duplicate) + empty name
    }
}
