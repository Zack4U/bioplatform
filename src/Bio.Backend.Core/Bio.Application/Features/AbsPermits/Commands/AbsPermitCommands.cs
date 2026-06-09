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
            request.Dto.GrantingAuthority, request.Dto.LegalFramework, request.Dto.DocumentUrl);
        await _repo.AddAsync(permit, ct);
        await _uow.SaveChangesAsync(ct);
        return MapToResponse(permit);
    }


    internal static AbsPermitResponseDTO MapToResponse(AbsPermit p) => new(
        p.Id, p.EntrepreneurId, p.Entrepreneur?.FullName ?? string.Empty, p.SpeciesId, p.ResolutionNumber,
        p.EmissionDate, p.ExpirationDate, p.GrantingAuthority, p.Status, p.LegalFramework,
        p.DocumentUrl, p.RequestedAt, p.Justification,
        p.ApprovedById, p.ApprovedBy?.FullName, p.ApprovedAt, p.RejectionReason);

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
        permit.Update(request.Dto.ExpirationDate, request.Dto.GrantingAuthority, request.Dto.LegalFramework, request.Dto.DocumentUrl);

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

// =============================================================================
// REQUEST ABS PERMIT (Entrepreneur — submits an access request: Status = "Pending")
// =============================================================================

public record RequestAbsPermitCommand(Guid EntrepreneurId, AbsPermitRequestDTO Dto) : IRequest<AbsPermitResponseDTO>;

public class RequestAbsPermitCommandHandler : IRequestHandler<RequestAbsPermitCommand, AbsPermitResponseDTO>
{
    private readonly IAbsPermitRepository _repo;
    private readonly IUnitOfWork _uow;

    public RequestAbsPermitCommandHandler(IAbsPermitRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<AbsPermitResponseDTO> Handle(RequestAbsPermitCommand request, CancellationToken ct)
    {
        var permit = AbsPermit.CreateRequest(request.EntrepreneurId, request.Dto.SpeciesId, request.Dto.Justification);
        await _repo.AddAsync(permit, ct);
        await _uow.SaveChangesAsync(ct);
        return CreateAbsPermitCommandHandler.MapToResponse(permit);
    }
}

// =============================================================================
// CANCEL ABS PERMIT REQUEST (Entrepreneur — withdraws own Pending request)
// A Pending request is not yet an issued legal permit, so hard-delete is allowed here.
// Issued permits (Active/Rejected/Revoked/etc.) remain immutable per Nagoya Protocol.
// =============================================================================

public record CancelAbsPermitRequestCommand(Guid PermitId, Guid EntrepreneurId) : IRequest<Unit>;

public class CancelAbsPermitRequestCommandHandler : IRequestHandler<CancelAbsPermitRequestCommand, Unit>
{
    private readonly IAbsPermitRepository _repo;
    private readonly IUnitOfWork _uow;

    public CancelAbsPermitRequestCommandHandler(IAbsPermitRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(CancelAbsPermitRequestCommand request, CancellationToken ct)
    {
        var permit = await _repo.GetByIdAsync(request.PermitId, ct)
            ?? throw new NotFoundException(nameof(AbsPermit), request.PermitId);

        if (permit.EntrepreneurId != request.EntrepreneurId)
            throw new ForbiddenException("You can only cancel your own permit requests.");
        if (permit.Status != "Pending")
            throw new ConflictException("Only pending requests can be cancelled.");

        await _repo.DeleteAsync(permit, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// =============================================================================
// APPROVE ABS PERMIT REQUEST (Admin/EnvironmentalAuthority — issues the official permit)
// =============================================================================

public record ApproveAbsPermitCommand(Guid PermitId, ApproveAbsPermitDTO Dto, Guid ActorId, string ActorRole) : IRequest<AbsPermitResponseDTO>;

public class ApproveAbsPermitCommandHandler : IRequestHandler<ApproveAbsPermitCommand, AbsPermitResponseDTO>
{
    private readonly IAbsPermitRepository _repo;
    private readonly IUnitOfWork _uow;

    public ApproveAbsPermitCommandHandler(IAbsPermitRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<AbsPermitResponseDTO> Handle(ApproveAbsPermitCommand request, CancellationToken ct)
    {
        if (request.ActorRole != RoleNames.Admin && request.ActorRole != RoleNames.EnvironmentalAuthority)
            throw new ForbiddenException("Only administrators and environmental authorities can approve ABS permit requests.");

        var permit = await _repo.GetByIdAsync(request.PermitId, ct)
            ?? throw new NotFoundException(nameof(AbsPermit), request.PermitId);

        if (permit.Status != "Pending")
            throw new ConflictException("Only pending requests can be approved.");

        permit.Approve(
            request.ActorId, request.Dto.ResolutionNumber, request.Dto.EmissionDate, request.Dto.ExpirationDate,
            request.Dto.GrantingAuthority, request.Dto.LegalFramework, request.Dto.DocumentUrl);
        await _uow.SaveChangesAsync(ct);
        return CreateAbsPermitCommandHandler.MapToResponse(permit);
    }
}

// =============================================================================
// REJECT ABS PERMIT REQUEST (Admin/EnvironmentalAuthority — declines with a reason)
// =============================================================================

public record RejectAbsPermitCommand(Guid PermitId, RejectAbsPermitDTO Dto, Guid ActorId, string ActorRole) : IRequest<AbsPermitResponseDTO>;

public class RejectAbsPermitCommandHandler : IRequestHandler<RejectAbsPermitCommand, AbsPermitResponseDTO>
{
    private readonly IAbsPermitRepository _repo;
    private readonly IUnitOfWork _uow;

    public RejectAbsPermitCommandHandler(IAbsPermitRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<AbsPermitResponseDTO> Handle(RejectAbsPermitCommand request, CancellationToken ct)
    {
        if (request.ActorRole != RoleNames.Admin && request.ActorRole != RoleNames.EnvironmentalAuthority)
            throw new ForbiddenException("Only administrators and environmental authorities can reject ABS permit requests.");

        var permit = await _repo.GetByIdAsync(request.PermitId, ct)
            ?? throw new NotFoundException(nameof(AbsPermit), request.PermitId);

        if (permit.Status != "Pending")
            throw new ConflictException("Only pending requests can be rejected.");
        if (string.IsNullOrWhiteSpace(request.Dto.Reason))
            throw new ValidationException("A rejection reason is required.");

        permit.Reject(request.ActorId, request.Dto.Reason);
        await _uow.SaveChangesAsync(ct);
        return CreateAbsPermitCommandHandler.MapToResponse(permit);
    }
}
