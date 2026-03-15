using Bio.Application.DTOs;
using Bio.Application.Features.Taxonomy.Commands.CreateTaxonomy;
using Bio.Domain.Interfaces;
using AutoMapper;
using Bio.Application.Mappings;
using Moq;
using Xunit;
using TaxonomyEntity = Bio.Domain.Entities.Taxonomy;

namespace Bio.UnitTests.Application.Features.Taxonomy.Commands;

public class CreateTaxonomyCommandHandlerTests
{
    private readonly IMapper _mapper;
    private readonly Mock<ITaxonomyRepository> _repositoryMock;
    private readonly Mock<IScientificUnitOfWork> _uowMock;

    public CreateTaxonomyCommandHandlerTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>(), Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();
        _repositoryMock = new Mock<ITaxonomyRepository>();
        _uowMock = new Mock<IScientificUnitOfWork>();
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<TaxonomyEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaxonomyEntity t, CancellationToken _) => t);
        _uowMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
    }

    [Fact]
    public async Task Handle_Should_ReturnTaxonomyResponseDTO()
    {
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<TaxonomyEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaxonomyEntity t, CancellationToken _) => t);
        var dto = new TaxonomyCreateDTO { Kingdom = "Plantae", Phylum = "Magnoliophyta", Genus = "Quercus" };
        var command = new CreateTaxonomyCommand(dto);
        var handler = new CreateTaxonomyCommandHandler(_repositoryMock.Object, _uowMock.Object, _mapper);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Plantae", result.Kingdom);
        Assert.Equal("Quercus", result.Genus);
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<TaxonomyEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
