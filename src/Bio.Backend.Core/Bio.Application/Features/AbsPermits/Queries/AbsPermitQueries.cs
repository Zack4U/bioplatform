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

// =============================================================================
// GET ALL ABS PERMITS (Admin & EnvironmentalAuthority — paginated)
// =============================================================================

public record GetAllAbsPermitsQuery(
    Guid? EntrepreneurId,
    string? Status,
    int Page,
    int PageSize) : IRequest<PaginatedResult<AbsPermitResponseDTO>>;

public class GetAllAbsPermitsQueryHandler
    : IRequestHandler<GetAllAbsPermitsQuery, PaginatedResult<AbsPermitResponseDTO>>
{
    private readonly IAbsPermitRepository _repo;
    public GetAllAbsPermitsQueryHandler(IAbsPermitRepository repo) => _repo = repo;

    public async Task<PaginatedResult<AbsPermitResponseDTO>> Handle(
        GetAllAbsPermitsQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetAllPagedAsync(
            request.EntrepreneurId, request.Status, request.Page, request.PageSize, ct);
        var dtos = items.Select(CreateAbsPermitCommandHandler.MapToResponse).ToList();
        return PaginatedResult<AbsPermitResponseDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}
