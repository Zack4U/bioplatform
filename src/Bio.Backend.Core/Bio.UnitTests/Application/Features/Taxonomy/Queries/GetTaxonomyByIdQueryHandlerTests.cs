using Bio.Application.DTOs;
using Bio.Application.Features.Taxonomy.Queries.GetTaxonomyById;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using AutoMapper;
using Bio.Application.Mappings;
using Moq;
using Xunit;
using TaxonomyEntity = Bio.Domain.Entities.Taxonomy;

namespace Bio.UnitTests.Application.Features.Taxonomy.Queries;

public class GetTaxonomyByIdQueryHandlerTests
{
    private readonly IMapper _mapper;
    private readonly Mock<ITaxonomyRepository> _repositoryMock;

    public GetTaxonomyByIdQueryHandlerTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>(), Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();
        _repositoryMock = new Mock<ITaxonomyRepository>();
    }

    [Fact]
    public async Task Handle_WhenNotFound_Should_ThrowNotFoundException()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((TaxonomyEntity?)null);
        var handler = new GetTaxonomyByIdQueryHandler(_repositoryMock.Object, _mapper);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            handler.Handle(new GetTaxonomyByIdQuery(99), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_WhenFound_Should_ReturnTaxonomyResponseDTO()
    {
        var taxonomy = new TaxonomyEntity("Plantae", "Magnoliophyta", "Magnoliopsida", "Fagales", "Fagaceae", "Quercus");
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(taxonomy);
        var handler = new GetTaxonomyByIdQueryHandler(_repositoryMock.Object, _mapper);

        var result = await handler.Handle(new GetTaxonomyByIdQuery(1), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Plantae", result.Kingdom);
        Assert.Equal("Quercus", result.Genus);
    }
}
