using Bio.Application.DTOs;
using Bio.Application.Features.Species.Commands.CreateSpecies;
using Bio.Application.Features.Species.Commands.UpdateSpecies;
using Bio.Application.Features.Species.Commands.DeleteSpecies;
using Bio.Application.Mappings;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using AutoMapper;
using Moq;
using Xunit;
using SpeciesEntity = Bio.Domain.Entities.Species;

namespace Bio.UnitTests.Application.Features.Species.Commands;

public class SpeciesCommandsTests
{
    private readonly IMapper _mapper;
    private readonly Mock<ISpeciesRepository> _repositoryMock;
    private readonly Mock<IScientificUnitOfWork> _uowMock;

    public SpeciesCommandsTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>(), Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();
        _repositoryMock = new Mock<ISpeciesRepository>();
        _uowMock = new Mock<IScientificUnitOfWork>();
    }

    // Create
    [Fact]
    public async Task CreateSpecies_WhenScientificNameExists_ThrowsConflict()
    {
        var dto = new SpeciesCreateDTO { Slug = "slug1", ScientificName = "Existing", LegalStatus = false, IsSensitive = false };
        _repositoryMock.Setup(r => r.GetByScientificNameAsync("Existing", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SpeciesEntity(Guid.NewGuid(), "slug2", "Existing"));

        var handler = new CreateSpeciesCommandHandler(_repositoryMock.Object, _uowMock.Object, _mapper);
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(new CreateSpeciesCommand(dto), CancellationToken.None));
    }

    [Fact]
    public async Task CreateSpecies_WhenSlugExists_ThrowsConflict()
    {
        var dto = new SpeciesCreateDTO { Slug = "slug1", ScientificName = "New", LegalStatus = false, IsSensitive = false };
        _repositoryMock.Setup(r => r.GetBySlugAsync("slug1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SpeciesEntity(Guid.NewGuid(), "slug1", "Other"));

        var handler = new CreateSpeciesCommandHandler(_repositoryMock.Object, _uowMock.Object, _mapper);
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(new CreateSpeciesCommand(dto), CancellationToken.None));
    }

    [Fact]
    public async Task CreateSpecies_ValidData_AddsAndSaves()
    {
        var dto = new SpeciesCreateDTO { Slug = "slug1", ScientificName = "NewSpec", LegalStatus = false, IsSensitive = false };
        var handler = new CreateSpeciesCommandHandler(_repositoryMock.Object, _uowMock.Object, _mapper);

        var result = await handler.Handle(new CreateSpeciesCommand(dto), CancellationToken.None);

        _repositoryMock.Verify(r => r.AddAsync(It.Is<SpeciesEntity>(s => s.ScientificName == "NewSpec"), It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal("NewSpec", result.ScientificName);
    }

    [Fact]
    public void CreateSpeciesValidator_Validates_Correctly()
    {
        var validator = new CreateSpeciesCommandValidator();
        var dto = new SpeciesCreateDTO { Slug = "", ScientificName = "" };
        var cmd = new CreateSpeciesCommand(dto);
        var result = validator.Validate(cmd);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Dto.Slug");
        Assert.Contains(result.Errors, e => e.PropertyName == "Dto.ScientificName");
    }

    // Update
    [Fact]
    public async Task UpdateSpecies_WhenNotFound_ThrowsNotFoundException()
    {
        var id = Guid.NewGuid();
        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync((SpeciesEntity?)null);
        var dto = new SpeciesUpdateDTO { Slug = "slug" };
        var handler = new UpdateSpeciesCommandHandler(_repositoryMock.Object, _uowMock.Object, _mapper);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UpdateSpeciesCommand(id, dto), CancellationToken.None));
    }

    [Fact]
    public async Task UpdateSpecies_WhenSlugConflicts_ThrowsConflict()
    {
        var id = Guid.NewGuid();
        var species = new SpeciesEntity(id, "old-slug", "Species");
        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(species);
        
        _repositoryMock.Setup(r => r.ExistsBySlugExcludingIdAsync("new-slug", id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var dto = new SpeciesUpdateDTO { Slug = "new-slug" };
        var handler = new UpdateSpeciesCommandHandler(_repositoryMock.Object, _uowMock.Object, _mapper);

        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(new UpdateSpeciesCommand(id, dto), CancellationToken.None));
    }

    [Fact]
    public async Task UpdateSpecies_ValidRequest_UpdatesAndSaves()
    {
        var id = Guid.NewGuid();
        var species = new SpeciesEntity(id, "old-slug", "Species");
        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(species);
        
        var dto = new SpeciesUpdateDTO { Slug = "new-slug", CommonName = "common" };
        var handler = new UpdateSpeciesCommandHandler(_repositoryMock.Object, _uowMock.Object, _mapper);

        var result = await handler.Handle(new UpdateSpeciesCommand(id, dto), CancellationToken.None);

        Assert.Equal("new-slug", species.Slug);
        Assert.Equal("common", species.CommonName);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal("new-slug", result.Slug);
    }

    // Delete
    [Fact]
    public async Task DeleteSpecies_WhenNotFound_ThrowsNotFoundException()
    {
        var id = Guid.NewGuid();
        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync((SpeciesEntity?)null);
        var handler = new DeleteSpeciesCommandHandler(_repositoryMock.Object, _uowMock.Object);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteSpeciesCommand(id), CancellationToken.None));
    }

    [Fact]
    public async Task DeleteSpecies_Should_DeleteAndSaveChanges()
    {
        var id = Guid.NewGuid();
        var species = new SpeciesEntity(id, "slug", "Species");
        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(species);
        var handler = new DeleteSpeciesCommandHandler(_repositoryMock.Object, _uowMock.Object);

        var result = await handler.Handle(new DeleteSpeciesCommand(id), CancellationToken.None);

        _repositoryMock.Verify(r => r.DeleteAsync(species, It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal(MediatR.Unit.Value, result);
    }
}
