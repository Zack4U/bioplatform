using Bio.Application.DTOs;
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
