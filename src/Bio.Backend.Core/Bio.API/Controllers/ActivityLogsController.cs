using Bio.Application.DTOs;
using Bio.Application.Features.ActivityLogs.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bio.API.Controllers;

/// <summary>
/// Audit activity log access — read-only, Admin only.
/// </summary>
[ApiController]
[Route("api/v1/activity-logs")]
[Authorize(Roles = "ADMIN")]
public class ActivityLogsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ActivityLogsController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Returns paginated activity logs with optional filters.
    /// Supports filtering by actor, action type, impact level, target entity, and date range.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResult<ActivityLogResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLogs(
        [FromQuery] ActivityLogFilterParams filters,
        CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetActivityLogsQuery(filters), ct));
    }

    /// <summary>Returns a single activity log entry by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ActivityLogResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetActivityLogByIdQuery(id), ct));
    }
}
