using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.ActivityLogs.Queries;

// =============================================================================
// GET ACTIVITY LOGS (Admin only — enforced at Controller level)
// =============================================================================

public record GetActivityLogsQuery(ActivityLogFilterParams Params) : IRequest<PaginatedResult<ActivityLogResponseDTO>>;

public class GetActivityLogsQueryHandler
    : IRequestHandler<GetActivityLogsQuery, PaginatedResult<ActivityLogResponseDTO>>
{
    private readonly IActivityLogRepository _repo;
    public GetActivityLogsQueryHandler(IActivityLogRepository repo) => _repo = repo;

    public async Task<PaginatedResult<ActivityLogResponseDTO>> Handle(
        GetActivityLogsQuery request, CancellationToken ct)
    {
        var p = request.Params;
        var (items, total) = await _repo.GetPagedAsync(
            p.ActorUserId, p.ActorType, p.ActionType, p.ImpactLevel,
            p.TargetType, p.TargetId, p.FromDate, p.ToDate,
            p.Page, p.PageSize, ct);

        var dtos = items.Select(MapToResponse).ToList();
        return PaginatedResult<ActivityLogResponseDTO>.Create(dtos, total, p.Page, p.PageSize);
    }

    // =============================================================================
    // GET SINGLE LOG
    // =============================================================================

    private static ActivityLogResponseDTO MapToResponse(ActivityLog log) => new(
        log.Id, log.ActorUserId, log.ActorType, log.ActionType, log.ImpactLevel,
        log.TargetType, log.TargetId, log.Summary, log.ChangeSet, log.Metadata,
        log.IpAddress, log.UserAgent, log.CreatedAt);
}

public record GetActivityLogByIdQuery(Guid Id) : IRequest<ActivityLogResponseDTO>;

public class GetActivityLogByIdQueryHandler : IRequestHandler<GetActivityLogByIdQuery, ActivityLogResponseDTO>
{
    private readonly IActivityLogRepository _repo;
    public GetActivityLogByIdQueryHandler(IActivityLogRepository repo) => _repo = repo;

    public async Task<ActivityLogResponseDTO> Handle(GetActivityLogByIdQuery request, CancellationToken ct)
    {
        var log = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(ActivityLog), request.Id);

        return new ActivityLogResponseDTO(
            log.Id, log.ActorUserId, log.ActorType, log.ActionType, log.ImpactLevel,
            log.TargetType, log.TargetId, log.Summary, log.ChangeSet, log.Metadata,
            log.IpAddress, log.UserAgent, log.CreatedAt);
    }
}
