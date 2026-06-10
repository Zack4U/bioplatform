using Bio.Application.DTOs;
using Bio.Application.Features.Dashboard.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Dashboard.Queries;

public class ResearcherDashboardQueriesTests
{
    private readonly Mock<ISpeciesRepository> _speciesRepoMock = new();
    private readonly Mock<ISpeciesImageRepository> _imageRepoMock = new();
    private readonly Mock<IGeographicDistributionRepository> _geoRepoMock = new();
    private readonly Mock<IAbsPermitRepository> _absRepoMock = new();

    [Fact]
    public async Task GetResearcherDashboard_ShouldReturnMetrics()
    {
        var researcherId = Guid.NewGuid();
        var species = new Bio.Domain.Entities.Species(Guid.NewGuid(), "Taxon1", "Sci", 1, null, "Com", "Desc", null, "Cons", "Endem", true, true);
        var speciesList = new List<Bio.Domain.Entities.Species> { species };
        IEnumerable<Bio.Domain.Entities.Species> speciesEnumerable = speciesList;

        var image = new Bio.Domain.Entities.SpeciesImage(species.Id, "url");
        var images = new List<Bio.Domain.Entities.SpeciesImage> { image };

        var geo = new Bio.Domain.Entities.GeographicDistribution(species.Id, 0, 0, null, "Municipality", null, null);
        var geoList = new List<Bio.Domain.Entities.GeographicDistribution> { geo };

        var permit = new Bio.Domain.Entities.AbsPermit(Guid.NewGuid(), species.Id, "RES123", DateTime.UtcNow, DateTime.UtcNow.AddDays(40), "Auth");
        var permits = new List<Bio.Domain.Entities.AbsPermit> { permit };

        _speciesRepoMock.Setup(r => r.GetAllAsync(null, null, default)).ReturnsAsync(speciesEnumerable);
        _imageRepoMock.Setup(r => r.GetAllAsync(default)).ReturnsAsync(images);
        _geoRepoMock.Setup(r => r.GetAllAsync(default)).ReturnsAsync(geoList);
        _absRepoMock.Setup(r => r.GetAllPagedAsync(null, "Active", 1, 10000, default)).ReturnsAsync((permits, 1));

        var handler = new GetResearcherDashboardQueryHandler(_speciesRepoMock.Object, _imageRepoMock.Object, _geoRepoMock.Object, _absRepoMock.Object);

        var result = await handler.Handle(new GetResearcherDashboardQuery(researcherId), default);

        result.Should().NotBeNull();
        result.TotalSpecies.Should().Be(1);
        result.TotalImages.Should().Be(1);
        result.ValidatedImages.Should().Be(0);
        result.GeographicRecordsCount.Should().Be(1);
        result.MunicipalitiesWithRecords.Should().Be(1);
        result.SpeciesWithActiveAbsPermits.Should().Be(1);
    }
}
