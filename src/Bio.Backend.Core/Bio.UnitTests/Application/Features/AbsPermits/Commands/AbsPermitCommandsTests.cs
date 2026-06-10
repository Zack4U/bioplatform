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

    // ── REQUEST ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RequestAbsPermit_ShouldCreatePendingRequest()
    {
        var handler = new RequestAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);
        var dto = new AbsPermitRequestDTO
        {
            SpeciesId = Guid.NewGuid(),
            Justification = "Investigación académica",
            ResolutionNumber = "RES-2025-200",
            EmissionDate = DateTime.UtcNow,
            ExpirationDate = DateTime.UtcNow.AddYears(1),
            GrantingAuthority = "ANLA"
        };

        var result = await handler.Handle(new RequestAbsPermitCommand(Guid.NewGuid(), dto), default);

        result.Should().NotBeNull();
        result.Status.Should().Be("Pending");
        _repoMock.Verify(r => r.AddAsync(It.IsAny<AbsPermit>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    // ── CANCEL REQUEST ─────────────────────────────────────────────────────────

    [Fact]
    public async Task CancelAbsPermitRequest_WhenOwnerAndPending_ShouldDelete()
    {
        var entrepreneurId = Guid.NewGuid();
        var permit = AbsPermit.CreateRequest(entrepreneurId, Guid.NewGuid(), "Justif", "RES", DateTime.UtcNow, DateTime.UtcNow.AddYears(1), "ANLA", null, null);
        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var handler = new CancelAbsPermitRequestCommandHandler(_repoMock.Object, _uowMock.Object);
        await handler.Handle(new CancelAbsPermitRequestCommand(permit.Id, entrepreneurId), default);

        _repoMock.Verify(r => r.DeleteAsync(permit, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task CancelAbsPermitRequest_WhenNotOwner_ShouldThrowForbidden()
    {
        var permit = AbsPermit.CreateRequest(Guid.NewGuid(), Guid.NewGuid(), "Justif", "RES", DateTime.UtcNow, DateTime.UtcNow.AddYears(1), "ANLA", null, null);
        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var handler = new CancelAbsPermitRequestCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(new CancelAbsPermitRequestCommand(permit.Id, Guid.NewGuid()), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task CancelAbsPermitRequest_WhenNotPending_ShouldThrowConflict()
    {
        var entrepreneurId = Guid.NewGuid();
        var permit = MakePermit(); // Status = "Active"

        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var handler = new CancelAbsPermitRequestCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(new CancelAbsPermitRequestCommand(permit.Id, permit.EntrepreneurId), default))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CancelAbsPermitRequest_WhenNotFound_ShouldThrowNotFound()
    {
        var permitId = Guid.NewGuid();
        _repoMock.Setup(r => r.GetByIdAsync(permitId, default)).ReturnsAsync((AbsPermit?)null);

        var handler = new CancelAbsPermitRequestCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(new CancelAbsPermitRequestCommand(permitId, Guid.NewGuid()), default))
            .Should().ThrowAsync<NotFoundException>();
    }

    // ── APPROVE REQUEST ────────────────────────────────────────────────────────

    private static AbsPermitRequestDTO MakeRequestDto() => new()
    {
        SpeciesId = Guid.NewGuid(),
        Justification = "Justif",
        ResolutionNumber = "RES",
        EmissionDate = DateTime.UtcNow,
        ExpirationDate = DateTime.UtcNow.AddYears(1),
        GrantingAuthority = "ANLA"
    };

    [Fact]
    public async Task ApproveAbsPermit_WhenValid_ShouldActivate()
    {
        var requestDto = MakeRequestDto();
        var permit = AbsPermit.CreateRequest(Guid.NewGuid(), requestDto.SpeciesId, requestDto.Justification,
            requestDto.ResolutionNumber, requestDto.EmissionDate, requestDto.ExpirationDate, requestDto.GrantingAuthority, null, null);
        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var approveDto = new ApproveAbsPermitDTO
        {
            ResolutionNumber = "RES-FINAL",
            EmissionDate = DateTime.UtcNow,
            ExpirationDate = DateTime.UtcNow.AddYears(1),
            GrantingAuthority = "ANLA"
        };

        var handler = new ApproveAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);
        var result = await handler.Handle(new ApproveAbsPermitCommand(permit.Id, approveDto, Guid.NewGuid(), RoleNames.Admin), default);

        result.Status.Should().Be("Active");
        result.ResolutionNumber.Should().Be("RES-FINAL");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task ApproveAbsPermit_WhenUnprivileged_ShouldThrowForbidden()
    {
        var handler = new ApproveAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(new ApproveAbsPermitCommand(Guid.NewGuid(), new ApproveAbsPermitDTO(), Guid.NewGuid(), RoleNames.Entrepreneur), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task ApproveAbsPermit_WhenNotFound_ShouldThrowNotFound()
    {
        var permitId = Guid.NewGuid();
        _repoMock.Setup(r => r.GetByIdAsync(permitId, default)).ReturnsAsync((AbsPermit?)null);

        var handler = new ApproveAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(new ApproveAbsPermitCommand(permitId, new ApproveAbsPermitDTO(), Guid.NewGuid(), RoleNames.Admin), default))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task ApproveAbsPermit_WhenNotPending_ShouldThrowConflict()
    {
        var permit = MakePermit(); // Status = "Active"
        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var handler = new ApproveAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(new ApproveAbsPermitCommand(permit.Id, new ApproveAbsPermitDTO(), Guid.NewGuid(), RoleNames.Admin), default))
            .Should().ThrowAsync<ConflictException>();
    }

    // ── REJECT REQUEST ─────────────────────────────────────────────────────────

    [Fact]
    public async Task RejectAbsPermit_WhenValid_ShouldReject()
    {
        var requestDto = MakeRequestDto();
        var permit = AbsPermit.CreateRequest(Guid.NewGuid(), requestDto.SpeciesId, requestDto.Justification,
            requestDto.ResolutionNumber, requestDto.EmissionDate, requestDto.ExpirationDate, requestDto.GrantingAuthority, null, null);
        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var handler = new RejectAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);
        var result = await handler.Handle(
            new RejectAbsPermitCommand(permit.Id, new RejectAbsPermitDTO { Reason = "Documentación incompleta" }, Guid.NewGuid(), RoleNames.EnvironmentalAuthority), default);

        result.Status.Should().Be("Rejected");
        result.RejectionReason.Should().Be("Documentación incompleta");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task RejectAbsPermit_WhenUnprivileged_ShouldThrowForbidden()
    {
        var handler = new RejectAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(new RejectAbsPermitCommand(Guid.NewGuid(), new RejectAbsPermitDTO { Reason = "x" }, Guid.NewGuid(), RoleNames.Entrepreneur), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task RejectAbsPermit_WhenNotFound_ShouldThrowNotFound()
    {
        var permitId = Guid.NewGuid();
        _repoMock.Setup(r => r.GetByIdAsync(permitId, default)).ReturnsAsync((AbsPermit?)null);

        var handler = new RejectAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(new RejectAbsPermitCommand(permitId, new RejectAbsPermitDTO { Reason = "x" }, Guid.NewGuid(), RoleNames.Admin), default))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task RejectAbsPermit_WhenNotPending_ShouldThrowConflict()
    {
        var permit = MakePermit(); // Status = "Active"
        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var handler = new RejectAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(new RejectAbsPermitCommand(permit.Id, new RejectAbsPermitDTO { Reason = "x" }, Guid.NewGuid(), RoleNames.Admin), default))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task RejectAbsPermit_WhenReasonEmpty_ShouldThrowValidation()
    {
        var requestDto = MakeRequestDto();
        var permit = AbsPermit.CreateRequest(Guid.NewGuid(), requestDto.SpeciesId, requestDto.Justification,
            requestDto.ResolutionNumber, requestDto.EmissionDate, requestDto.ExpirationDate, requestDto.GrantingAuthority, null, null);
        _repoMock.Setup(r => r.GetByIdAsync(permit.Id, default)).ReturnsAsync(permit);

        var handler = new RejectAbsPermitCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(new RejectAbsPermitCommand(permit.Id, new RejectAbsPermitDTO { Reason = "  " }, Guid.NewGuid(), RoleNames.Admin), default))
            .Should().ThrowAsync<Bio.Domain.Exceptions.ValidationException>();
    }
}
