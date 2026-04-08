using Bio.Application.Features.Taxonomy.Queries.GetAllTaxonomies;
using Bio.Application.Features.Taxonomy.Queries.GetTaxonomyById;
using Bio.Application.DTOs;
using Bio.Application.Mappings;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using AutoMapper;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Taxonomy.Queries;

public class TaxonomyQueriesTests
{
    private readonly IMapper _mapper;
    private readonly Mock<ITaxonomyRepository> _repositoryMock;

    public TaxonomyQueriesTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>(), Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();
        _repositoryMock = new Mock<ITaxonomyRepository>();
    }

    [Fact]
    public async Task GetAllTaxonomies_Should_ReturnMappedList()
    {
        var taxonomies = new List<Bio.Domain.Entities.Taxonomy>
        {
            new("Animalia", "Chordata", "Mammalia", "Carnivora", "Felidae", "Panthera"),
            new("Plantae", "Magnoliophyta", "Magnoliopsida", "Fagales", "Fagaceae", "Quercus")
        };

        _repositoryMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(taxonomies);

        var handler = new GetAllTaxonomiesQueryHandler(_repositoryMock.Object, _mapper);
        var result = await handler.Handle(new GetAllTaxonomiesQuery(), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
    }
}
