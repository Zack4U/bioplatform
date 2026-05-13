using Bio.Application.DTOs;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.AbsPermits.Commands;

public record CreateAbsPermitCommand(AbsPermitCreateDTO Dto) : IRequest<AbsPermitResponseDTO>;

public class CreateAbsPermitCommandHandler : IRequestHandler<CreateAbsPermitCommand, AbsPermitResponseDTO>
{
    private readonly IAbsPermitRepository _repo;
    private readonly IUnitOfWork _uow;

    public CreateAbsPermitCommandHandler(IAbsPermitRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<AbsPermitResponseDTO> Handle(CreateAbsPermitCommand request, CancellationToken ct)
    {
        var permit = new AbsPermit(request.Dto.EntrepreneurId, request.Dto.SpeciesId,
            request.Dto.ResolutionNumber, request.Dto.EmissionDate, request.Dto.ExpirationDate,
            request.Dto.GrantingAuthority, request.Dto.LegalFramework);
        await _repo.AddAsync(permit, ct);
        await _uow.SaveChangesAsync(ct);
        return MapToResponse(permit);
    }

    internal static AbsPermitResponseDTO MapToResponse(AbsPermit p) => new(
        p.Id, p.EntrepreneurId, p.SpeciesId, p.ResolutionNumber,
        p.EmissionDate, p.ExpirationDate, p.GrantingAuthority, p.Status, p.LegalFramework);
}

public record UpdateAbsPermitCommand(Guid Id, AbsPermitUpdateDTO Dto) : IRequest<AbsPermitResponseDTO>;

public class UpdateAbsPermitCommandHandler : IRequestHandler<UpdateAbsPermitCommand, AbsPermitResponseDTO>
{
    private readonly IAbsPermitRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpdateAbsPermitCommandHandler(IAbsPermitRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<AbsPermitResponseDTO> Handle(UpdateAbsPermitCommand request, CancellationToken ct)
    {
        var permit = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(AbsPermit), request.Id);
        permit.Update(request.Dto.ExpirationDate, request.Dto.GrantingAuthority, request.Dto.LegalFramework);
        if (request.Dto.Status != null) permit.UpdateStatus(request.Dto.Status);
        await _uow.SaveChangesAsync(ct);
        return CreateAbsPermitCommandHandler.MapToResponse(permit);
    }
}

// =============================================================================
// REVOKE ABS PERMIT (soft-delete: Status = "Revoked")
// Hard-delete is never permitted — ABS permits must be auditable per Nagoya Protocol.
// =============================================================================

public record RevokeAbsPermitCommand(
    Guid PermitId,
    Guid ActorId,
    string ActorRole) : IRequest<AbsPermitResponseDTO>;

public class RevokeAbsPermitCommandHandler : IRequestHandler<RevokeAbsPermitCommand, AbsPermitResponseDTO>
{
    private readonly IAbsPermitRepository _repo;
    private readonly IUnitOfWork _uow;

    public RevokeAbsPermitCommandHandler(IAbsPermitRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<AbsPermitResponseDTO> Handle(RevokeAbsPermitCommand request, CancellationToken ct)
    {
        // Only Admin and EnvironmentalAuthority can revoke permits
        if (request.ActorRole != RoleNames.Admin && request.ActorRole != RoleNames.EnvironmentalAuthority)
            throw new ForbiddenException("Only administrators and environmental authorities can revoke ABS permits.");

        var permit = await _repo.GetByIdAsync(request.PermitId, ct)
            ?? throw new NotFoundException(nameof(AbsPermit), request.PermitId);

        if (permit.Status == "Revoked")
            throw new ConflictException("This permit is already revoked.");

        permit.UpdateStatus("Revoked");
        await _uow.SaveChangesAsync(ct);
        return CreateAbsPermitCommandHandler.MapToResponse(permit);
    }
}
