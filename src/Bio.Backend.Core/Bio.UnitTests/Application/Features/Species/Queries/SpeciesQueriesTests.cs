using Bio.Application.DTOs;
using Bio.Application.Features.Species.Queries.GetAllSpecies;
using Bio.Application.Features.Species.Queries.GetSpeciesById;
using Bio.Application.Features.Species.Queries.GetSpeciesBySlug;
using Bio.Application.Interfaces;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using AutoMapper;
using Moq;
using Xunit;
using SpeciesEntity = Bio.Domain.Entities.Species;

namespace Bio.UnitTests.Application.Features.Species.Queries;

public class SpeciesQueriesTests
{
    private readonly Mock<ISpeciesRepository> _speciesRepoMock;
    private readonly Mock<IGeographicDistributionRepository> _distRepoMock;
    private readonly Mock<IRelatedProductsQuery> _productsQueryMock;

    public SpeciesQueriesTests()
    {
        _speciesRepoMock = new Mock<ISpeciesRepository>();
        _distRepoMock = new Mock<IGeographicDistributionRepository>();
        _productsQueryMock = new Mock<IRelatedProductsQuery>();
    }

    [Fact]
    public async Task GetAllSpecies_Should_ReturnPaginatedResult()
    {
        var speciesList = new List<SpeciesEntity>
        {
            new(Guid.NewGuid(), "panthera-onca", "Panthera onca")
        };
        _speciesRepoMock.Setup(r => r.GetFilteredAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool?>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((speciesList, 1));

        var handler = new GetAllSpeciesQueryHandler(_speciesRepoMock.Object);
        var result = await handler.Handle(new GetAllSpeciesQuery(), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal(1, result.TotalCount);
    }

    [Fact]
    public async Task GetSpeciesById_WhenNotFound_ThrowsNotFoundException()
    {
        var id = Guid.NewGuid();
        _speciesRepoMock.Setup(r => r.GetByIdWithDistributionsAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SpeciesEntity?)null);

        var handler = new GetSpeciesByIdQueryHandler(_speciesRepoMock.Object, _distRepoMock.Object, _productsQueryMock.Object);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new GetSpeciesByIdQuery(id), CancellationToken.None));
    }

    [Fact]
    public async Task GetSpeciesById_WhenSensitiveAndNotPrivileged_ShouldMaskCoordinates()
    {
        var id = Guid.NewGuid();
        var species = new SpeciesEntity(id, "sensitive-sp", "Sensitiva rara", isSensitive: true);
        species.GeographicDistributions.Add(new GeographicDistribution(id, 4.5, -74.0, 2000, "Bogotá", "Páramo", null));

        _speciesRepoMock.Setup(r => r.GetByIdWithDistributionsAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(species);
        _productsQueryMock.Setup(r => r.GetBySpeciesIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RelatedProductDTO>());

        var handler = new GetSpeciesByIdQueryHandler(_speciesRepoMock.Object, _distRepoMock.Object, _productsQueryMock.Object);
        var result = await handler.Handle(new GetSpeciesByIdQuery(id, "User"), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Single(result.Distributions);
        var dist = result.Distributions.First();
        Assert.True(dist.IsMasked);
        Assert.Null(dist.Latitude);
        Assert.Null(dist.Longitude);
        Assert.Equal(2000, dist.Altitude);
    }

    [Fact]
    public async Task GetSpeciesBySlug_WhenFound_ReturnsDto()
    {
        var id = Guid.NewGuid();
        var species = new SpeciesEntity(id, "panthera-onca", "Panthera onca", isSensitive: false);
        species.GeographicDistributions.Add(new GeographicDistribution(id, 4.5, -74.0));

        _speciesRepoMock.Setup(r => r.GetBySlugWithDistributionsAsync("panthera-onca", It.IsAny<CancellationToken>()))
            .ReturnsAsync(species);
        _productsQueryMock.Setup(r => r.GetBySpeciesIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RelatedProductDTO>());

        var handler = new GetSpeciesBySlugQueryHandler(_speciesRepoMock.Object, _distRepoMock.Object, _productsQueryMock.Object);
        var result = await handler.Handle(new GetSpeciesBySlugQuery("panthera-onca"), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Single(result.Distributions);
        Assert.False(result.Distributions.First().IsMasked);
        Assert.Equal(4.5, result.Distributions.First().Latitude);
    }
}
