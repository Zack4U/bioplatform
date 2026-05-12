using Bio.Application.DTOs;
using Bio.Application.Features.AbsPermits.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.AbsPermits.Commands;

public class AbsPermitCommandsTests
{
    private readonly Mock<IAbsPermitRepository> _repoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    [Fact]
    public async Task CreateAbsPermit_ShouldCreate()
    {
        var handler = new CreateAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);
        var dto = new AbsPermitCreateDTO
        {
            EntrepreneurId = Guid.NewGuid(),
            SpeciesId = Guid.NewGuid(),
            ResolutionNumber = "RES",
            EmissionDate = DateTime.UtcNow,
            ExpirationDate = DateTime.UtcNow.AddYears(1),
            GrantingAuthority = "Auth"
        };

        var result = await handler.Handle(new CreateAbsPermitCommand(dto), default);

        result.Should().NotBeNull();
        result.ResolutionNumber.Should().Be("RES");
        _repoMock.Verify(r => r.AddAsync(It.IsAny<AbsPermit>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdateAbsPermit_WhenFound_ShouldUpdate()
    {
        var id = Guid.NewGuid();
        var permit = new AbsPermit(Guid.NewGuid(), Guid.NewGuid(), "RES", DateTime.UtcNow, DateTime.UtcNow.AddYears(1), "Auth");
        var dto = new AbsPermitUpdateDTO { GrantingAuthority = "New Auth", Status = "Expired" };

        _repoMock.Setup(r => r.GetByIdAsync(id, default)).ReturnsAsync(permit);

        var handler = new UpdateAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);
        var result = await handler.Handle(new UpdateAbsPermitCommand(id, dto), default);

        result.Should().NotBeNull();
        result.GrantingAuthority.Should().Be("New Auth");
        result.Status.Should().Be("Expired");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdateAbsPermit_WhenNotFound_ShouldThrowNotFoundException()
    {
        var id = Guid.NewGuid();
        _repoMock.Setup(r => r.GetByIdAsync(id, default)).ReturnsAsync((AbsPermit?)null);

        var handler = new UpdateAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);
        await FluentActions.Awaiting(() => handler.Handle(new UpdateAbsPermitCommand(id, new AbsPermitUpdateDTO()), default))
            .Should().ThrowAsync<NotFoundException>();
    }
}
