using Bio.Application.DTOs;
using Bio.Application.Features.Species.Commands.AddDistribution;
using Bio.Domain.Constants;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;
using DomainSpecies = Bio.Domain.Entities.Species;
using DomainDistribution = Bio.Domain.Entities.GeographicDistribution;

namespace Bio.UnitTests.Application.Features.Species.Commands.AddDistribution;

public class GeographicDistributionCommandsTests
{
    private readonly Mock<IGeographicDistributionRepository> _distRepoMock = new();
    private readonly Mock<ISpeciesRepository> _speciesRepoMock = new();
    private readonly Mock<IScientificUnitOfWork> _uowMock = new();

    private static DomainSpecies MakeSpecies(bool isSensitive = false)
        => new DomainSpecies(
            Guid.NewGuid(),
            "panthera-leo",
            "Panthera leo",
            commonName: "Lion",
            isSensitive: isSensitive);

    private AddGeographicDistributionCommandHandler CreateHandler()
        => new(_distRepoMock.Object, _speciesRepoMock.Object, _uowMock.Object);

    // ── ADD ────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task AddDistribution_WhenValidResearcher_ShouldCreate()
    {
        var speciesId = Guid.NewGuid();
        var species = MakeSpecies();
        var dto = new GeographicDistributionCreateDTO
        {
            Latitude = 4.7110,
            Longitude = -74.0721,
            Altitude = 2600,
            Municipality = "Bogotá",
            EcosystemType = "Andean Forest"
        };

        _speciesRepoMock.Setup(r => r.GetByIdAsync(speciesId, default)).ReturnsAsync(species);
        _distRepoMock.Setup(r => r.ExistsBySpeciesAndCoordinatesAsync(
            speciesId, dto.Latitude, dto.Longitude, default)).ReturnsAsync(false);

        var handler = CreateHandler();
        var result = await handler.Handle(
            new AddGeographicDistributionCommand(speciesId, dto, Guid.NewGuid(), RoleNames.Researcher), default);

        result.Should().NotBeNull();
        result.Latitude.Should().Be(dto.Latitude);
        result.Longitude.Should().Be(dto.Longitude);
        result.IsMasked.Should().BeFalse();
        _distRepoMock.Verify(r => r.AddAsync(It.IsAny<DomainDistribution>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task AddDistribution_WhenDuplicateCoordinates_ShouldThrowConflict()
    {
        var speciesId = Guid.NewGuid();
        var species = MakeSpecies();
        var dto = new GeographicDistributionCreateDTO { Latitude = 4.711, Longitude = -74.072 };

        _speciesRepoMock.Setup(r => r.GetByIdAsync(speciesId, default)).ReturnsAsync(species);
        _distRepoMock.Setup(r => r.ExistsBySpeciesAndCoordinatesAsync(
            speciesId, dto.Latitude, dto.Longitude, default)).ReturnsAsync(true);

        var handler = CreateHandler();

        await FluentActions
            .Awaiting(() => handler.Handle(
                new AddGeographicDistributionCommand(speciesId, dto, Guid.NewGuid(), RoleNames.Researcher), default))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task AddDistribution_WhenUnprivilegedRole_ShouldThrowForbidden()
    {
        var speciesId = Guid.NewGuid();
        var dto = new GeographicDistributionCreateDTO { Latitude = 4.711, Longitude = -74.072 };

        var handler = CreateHandler();

        await FluentActions
            .Awaiting(() => handler.Handle(
                new AddGeographicDistributionCommand(speciesId, dto, Guid.NewGuid(), RoleNames.Buyer), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task AddDistribution_WhenSpeciesNotFound_ShouldThrowNotFoundException()
    {
        var speciesId = Guid.NewGuid();
        var dto = new GeographicDistributionCreateDTO { Latitude = 4.711, Longitude = -74.072 };

        _speciesRepoMock.Setup(r => r.GetByIdAsync(speciesId, default))
            .ReturnsAsync((DomainSpecies?)null);

        var handler = CreateHandler();

        await FluentActions
            .Awaiting(() => handler.Handle(
                new AddGeographicDistributionCommand(speciesId, dto, Guid.NewGuid(), RoleNames.Admin), default))
            .Should().ThrowAsync<NotFoundException>();
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteDistribution_WhenAdmin_ShouldDelete()
    {
        var distributionId = Guid.NewGuid();
        var distribution = new DomainDistribution(
            Guid.NewGuid(), 4.711, -74.072, null, "Bogotá", null, null!);

        _distRepoMock.Setup(r => r.GetByIdAsync(distributionId, default)).ReturnsAsync(distribution);

        var handler = new DeleteGeographicDistributionCommandHandler(_distRepoMock.Object, _uowMock.Object);
        await handler.Handle(
            new DeleteGeographicDistributionCommand(distributionId, Guid.NewGuid(), RoleNames.Admin), default);

        _distRepoMock.Verify(r => r.DeleteAsync(distribution, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeleteDistribution_WhenUnprivilegedRole_ShouldThrowForbidden()
    {
        var handler = new DeleteGeographicDistributionCommandHandler(_distRepoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new DeleteGeographicDistributionCommand(Guid.NewGuid(), Guid.NewGuid(), RoleNames.Entrepreneur), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task DeleteDistribution_WhenNotFound_ShouldThrowNotFoundException()
    {
        var distributionId = Guid.NewGuid();
        _distRepoMock.Setup(r => r.GetByIdAsync(distributionId, default))
            .ReturnsAsync((DomainDistribution?)null);

        var handler = new DeleteGeographicDistributionCommandHandler(_distRepoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new DeleteGeographicDistributionCommand(distributionId, Guid.NewGuid(), RoleNames.Admin), default))
            .Should().ThrowAsync<NotFoundException>();
    }
}
