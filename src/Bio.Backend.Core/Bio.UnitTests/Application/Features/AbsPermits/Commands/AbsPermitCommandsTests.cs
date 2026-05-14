using Bio.Application.DTOs;
using Bio.Application.Features.AbsPermits.Commands;
using Bio.Domain.Constants;
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

    private static AbsPermit MakePermit()
        => new AbsPermit(
            Guid.NewGuid(), Guid.NewGuid(),
            "RES-2025-001",
            DateTime.UtcNow.AddDays(-30),
            DateTime.UtcNow.AddDays(335),
            "ANLA",
            "Ley 165 de 1994");

    // ── CREATE ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAbsPermit_WhenValid_ShouldCreate()
    {
        var handler = new CreateAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);
        var dto = new AbsPermitCreateDTO
        {
            EntrepreneurId = Guid.NewGuid(),
            SpeciesId = Guid.NewGuid(),
            ResolutionNumber = "RES-2025-100",
            EmissionDate = DateTime.UtcNow.AddDays(-10),
            ExpirationDate = DateTime.UtcNow.AddDays(355),
            GrantingAuthority = "ANLA",
            LegalFramework = "Ley 165 de 1994"
        };

        var result = await handler.Handle(new CreateAbsPermitCommand(dto), default);

        result.Should().NotBeNull();
        result.ResolutionNumber.Should().Be("RES-2025-100");
        _repoMock.Verify(r => r.AddAsync(It.IsAny<AbsPermit>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    // ── REVOKE ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RevokeAbsPermit_WhenAdmin_ShouldSetRevoked()
    {
        var permit = MakePermit();
        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var handler = new RevokeAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);
        var result = await handler.Handle(
            new RevokeAbsPermitCommand(permit.Id, Guid.NewGuid(), RoleNames.Admin), default);

        result.Status.Should().Be("Revoked");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task RevokeAbsPermit_WhenEnvironmentalAuthority_ShouldSucceed()
    {
        var permit = MakePermit();
        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var handler = new RevokeAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);
        var result = await handler.Handle(
            new RevokeAbsPermitCommand(permit.Id, Guid.NewGuid(), RoleNames.EnvironmentalAuthority), default);

        result.Status.Should().Be("Revoked");
    }

    [Fact]
    public async Task RevokeAbsPermit_WhenUnprivilegedRole_ShouldThrowForbidden()
    {
        var handler = new RevokeAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new RevokeAbsPermitCommand(Guid.NewGuid(), Guid.NewGuid(), RoleNames.Entrepreneur), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task RevokeAbsPermit_WhenAlreadyRevoked_ShouldThrowConflict()
    {
        var permit = MakePermit();
        permit.UpdateStatus("Revoked");
        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var handler = new RevokeAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new RevokeAbsPermitCommand(permit.Id, Guid.NewGuid(), RoleNames.Admin), default))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task RevokeAbsPermit_WhenNotFound_ShouldThrowNotFoundException()
    {
        var permitId = Guid.NewGuid();
        _repoMock.Setup(r => r.GetByIdAsync(permitId, default)).ReturnsAsync((AbsPermit?)null);

        var handler = new RevokeAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new RevokeAbsPermitCommand(permitId, Guid.NewGuid(), RoleNames.Admin), default))
            .Should().ThrowAsync<NotFoundException>();
    }

    // ── UPDATE ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAbsPermit_WhenValid_ShouldUpdate()
    {
        var permit = MakePermit();
        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var handler = new UpdateAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);
        var dto = new AbsPermitUpdateDTO
        {
            ExpirationDate = DateTime.UtcNow.AddDays(730),
            GrantingAuthority = "MADS",
            LegalFramework = null,
            Status = null
        };

        var result = await handler.Handle(new UpdateAbsPermitCommand(permit.Id, dto), default);

        result.Should().NotBeNull();
        result.GrantingAuthority.Should().Be("MADS");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
