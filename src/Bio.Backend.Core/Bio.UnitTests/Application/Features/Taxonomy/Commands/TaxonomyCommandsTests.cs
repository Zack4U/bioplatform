using Bio.Application.DTOs;
using Bio.Application.Features.Taxonomy.Commands.CreateTaxonomy;
using Bio.Application.Features.Taxonomy.Commands.UpdateTaxonomy;
using Bio.Application.Features.Taxonomy.Commands.DeleteTaxonomy;
using Bio.Application.Mappings;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using AutoMapper;
using Moq;
using Xunit;
using TaxonomyEntity = Bio.Domain.Entities.Taxonomy;

namespace Bio.UnitTests.Application.Features.Taxonomy.Commands;

public class TaxonomyCommandsTests
{
    private readonly IMapper _mapper;
    private readonly Mock<ITaxonomyRepository> _repositoryMock;
    private readonly Mock<IScientificUnitOfWork> _uowMock;

    public TaxonomyCommandsTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>(), Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();
        _repositoryMock = new Mock<ITaxonomyRepository>();
        _uowMock = new Mock<IScientificUnitOfWork>();
    }

    // Create
    [Fact]
    public async Task CreateTaxonomy_Should_AddAndSaveChanges()
    {
        var dto = new TaxonomyCreateDTO { Kingdom = "Animalia", Phylum = "Chordata", ClassName = "Mammalia", OrderName = "Carnivora", Family = "Felidae", Genus = "Panthera" };
        var handler = new CreateTaxonomyCommandHandler(_repositoryMock.Object, _uowMock.Object, _mapper);

        var result = await handler.Handle(new CreateTaxonomyCommand(dto), CancellationToken.None);

        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<TaxonomyEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal("Panthera", result.Genus);
    }

    [Fact]
    public void CreateTaxonomyValidator_Validates_Correctly()
    {
        var validator = new CreateTaxonomyCommandValidator();
        var dto = new TaxonomyCreateDTO { Kingdom = new string('A', 51) }; // Exceeds MaxLength
        var cmd = new CreateTaxonomyCommand(dto);
        var result = validator.Validate(cmd);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Dto.Kingdom");
    }

    // Update
    [Fact]
    public async Task UpdateTaxonomy_WhenNotFound_ThrowsNotFoundException()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((TaxonomyEntity?)null);
        var dto = new TaxonomyUpdateDTO { Kingdom = "Animalia" };
        var handler = new UpdateTaxonomyCommandHandler(_repositoryMock.Object, _uowMock.Object, _mapper);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UpdateTaxonomyCommand(99, dto), CancellationToken.None));
    }

    [Fact]
    public async Task UpdateTaxonomy_Should_UpdateAndSaveChanges()
    {
        var taxonomy = new TaxonomyEntity("Animalia", "Chordata", "Mammalia", "Carnivora", "Canidae", "Canis");
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(taxonomy);
        var dto = new TaxonomyUpdateDTO { Family = "Felidae", Genus = "Felis" };
        var handler = new UpdateTaxonomyCommandHandler(_repositoryMock.Object, _uowMock.Object, _mapper);

        var result = await handler.Handle(new UpdateTaxonomyCommand(1, dto), CancellationToken.None);

        Assert.Equal("Felidae", taxonomy.Family);
        Assert.Equal("Felis", taxonomy.Genus);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal("Felis", result.Genus);
    }

    [Fact]
    public void UpdateTaxonomyValidator_Validates_Correctly()
    {
        var validator = new UpdateTaxonomyCommandValidator();
        var dto = new TaxonomyUpdateDTO();
        var cmd = new UpdateTaxonomyCommand(1, dto);
        var result = validator.Validate(cmd);
        Assert.True(result.IsValid);
    }

    // Delete
    [Fact]
    public async Task DeleteTaxonomy_WhenNotFound_ThrowsNotFoundException()
    {
         _repositoryMock.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((TaxonomyEntity?)null);
        var handler = new DeleteTaxonomyCommandHandler(_repositoryMock.Object, _uowMock.Object);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteTaxonomyCommand(99), CancellationToken.None));
    }

    [Fact]
    public async Task DeleteTaxonomy_Should_DeleteAndSaveChanges()
    {
        var taxonomy = new TaxonomyEntity("Animalia", "Chordata", "Mammalia", "Carnivora", "Canidae", "Canis");
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(taxonomy);
        var handler = new DeleteTaxonomyCommandHandler(_repositoryMock.Object, _uowMock.Object);

        var result = await handler.Handle(new DeleteTaxonomyCommand(1), CancellationToken.None);

        _repositoryMock.Verify(r => r.DeleteAsync(taxonomy, It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal(MediatR.Unit.Value, result);
    }
}
