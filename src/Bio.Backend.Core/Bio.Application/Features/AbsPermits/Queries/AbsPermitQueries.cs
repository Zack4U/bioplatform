using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using Bio.Domain.Exceptions;
using MediatR;
using Bio.Application.Features.AbsPermits.Commands;

namespace Bio.Application.Features.AbsPermits.Queries;

public record GetAbsPermitsByEntrepreneurQuery(Guid EntrepreneurId) : IRequest<IReadOnlyList<AbsPermitResponseDTO>>;

public class GetAbsPermitsByEntrepreneurQueryHandler : IRequestHandler<GetAbsPermitsByEntrepreneurQuery, IReadOnlyList<AbsPermitResponseDTO>>
{
    private readonly IAbsPermitRepository _repo;
    public GetAbsPermitsByEntrepreneurQueryHandler(IAbsPermitRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<AbsPermitResponseDTO>> Handle(GetAbsPermitsByEntrepreneurQuery request, CancellationToken ct)
    {
        var items = await _repo.GetByEntrepreneurIdAsync(request.EntrepreneurId, ct);
        return items.Select(CreateAbsPermitCommandHandler.MapToResponse).ToList();
    }
}

public record GetAbsPermitByIdQuery(Guid Id) : IRequest<AbsPermitResponseDTO>;

public class GetAbsPermitByIdQueryHandler : IRequestHandler<GetAbsPermitByIdQuery, AbsPermitResponseDTO>
{
    private readonly IAbsPermitRepository _repo;
    public GetAbsPermitByIdQueryHandler(IAbsPermitRepository repo) => _repo = repo;

    public async Task<AbsPermitResponseDTO> Handle(GetAbsPermitByIdQuery request, CancellationToken ct)
    {
        var permit = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException("AbsPermit", request.Id);
        return CreateAbsPermitCommandHandler.MapToResponse(permit);
    }
}
