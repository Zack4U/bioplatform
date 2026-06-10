using Bio.Application.DTOs;
using Bio.Application.Features.Requests.Queries;
using Bio.Domain.Constants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// Aggregated platform requests — unified view of pending actions requiring review.
/// Sources: ABS permits, species image validations, product approvals, account verifications.
/// Read access: Admin/EnvironmentalAuthority see and review all requests.
/// Entrepreneur/Researcher see only their own submitted requests ("Mis solicitudes").
/// </summary>
[ApiController]
[Route("api/v1/requests")]
[Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority},{RoleNames.Entrepreneur},{RoleNames.Researcher}")]
[Produces("application/json")]
public class RequestsController : ControllerBase
{
    private readonly IMediator _mediator;
    public RequestsController(IMediator mediator) => _mediator = mediator;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException("User identity missing."));
    private string GetUserRole() => User.FindFirstValue("role") ?? string.Empty;

    /// <summary>
    /// Returns a paginated, aggregated list of platform requests.
    /// Admin/EnvironmentalAuthority see all requests (review queue).
    /// Entrepreneur/Researcher are scoped to their own submissions regardless of the query.
    /// Supports filtering by type (abs_permit, image_validation, etc.) and status.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResult<PlatformRequestDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] PlatformRequestFilterParams filters,
        CancellationToken ct)
    {
        var role = GetUserRole();
        var isReviewer = role == RoleNames.Admin || role == RoleNames.EnvironmentalAuthority;
        var scopedFilters = isReviewer ? filters : filters with { RequesterId = GetUserId() };

        return Ok(await _mediator.Send(new GetPlatformRequestsQuery(scopedFilters, role), ct));
    }
}
