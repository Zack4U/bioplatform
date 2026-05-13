using AutoMapper;
using Bio.Application.DTOs;
using Bio.Application.Features.Taxonomy.Queries.GetAllTaxonomies;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Taxonomy.Queries;

public class GetAllTaxonomiesQueryTests
{
    private readonly Mock<ITaxonomyRepository> _repoMock = new();
    private readonly Mock<IMapper> _mapperMock = new();

    [Fact]
    public async Task Handle_ReturnsListOfTaxonomyResponseDTO()
    {
        var taxonomy = new Bio.Domain.Entities.Taxonomy("Kingdom", "Phylum", "Class", "Order", "Family", "Genus");
        var taxonomies = new List<Bio.Domain.Entities.Taxonomy> { taxonomy };
        var dtos = new List<TaxonomyResponseDTO> { new TaxonomyResponseDTO(taxonomy.Id, "Kingdom", "Phylum", "Class", "Order", "Family", "Genus") };

        _repoMock.Setup(r => r.GetAllAsync(default)).ReturnsAsync(taxonomies);
        _mapperMock.Setup(m => m.Map<IEnumerable<TaxonomyResponseDTO>>(taxonomies)).Returns(dtos);

        var handler = new GetAllTaxonomiesQueryHandler(_repoMock.Object, _mapperMock.Object);

        var result = await handler.Handle(new GetAllTaxonomiesQuery(), default);

        result.Should().NotBeNull();
        result.Should().HaveCount(1);
    }
}
