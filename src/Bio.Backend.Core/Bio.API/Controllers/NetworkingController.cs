using Bio.Application.DTOs;
using Bio.Application.Features.Community.Connections.Commands;
using Bio.Application.Features.Community.Connections.Queries;
using Bio.Domain.Constants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// User networking: connection requests and accepted connections.
/// All endpoints require authentication.
/// </summary>
[ApiController]
[Route("api/v1/networking")]
[Authorize]
[Produces("application/json")]
public class NetworkingController : ControllerBase
{
    private readonly IMediator _mediator;

    public NetworkingController(IMediator mediator) => _mediator = mediator;

    private Guid ActorId => Guid.Parse(
        User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException("User identity missing."));
    private string ActorRole => User.FindFirstValue("role") ?? string.Empty;

    /// <summary>
    /// Returns the authenticated user's connections, optionally filtered by status.
    /// Status options: Pending, Accepted, Rejected, Blocked.
    /// </summary>
    [HttpGet("connections")]
    [ProducesResponseType(typeof(PaginatedResult<UserConnectionResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyConnections(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await _mediator.Send(
            new GetMyConnectionsQuery(ActorId, status, page, pageSize), ct));

    /// <summary>Returns pending connection requests received by the authenticated user.</summary>
    [HttpGet("connections/pending")]
    [ProducesResponseType(typeof(PaginatedResult<UserConnectionResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await _mediator.Send(
            new GetPendingConnectionRequestsQuery(ActorId, page, pageSize), ct));

    /// <summary>Sends a connection request to another user.</summary>
    [HttpPost("connections")]
    [ProducesResponseType(typeof(UserConnectionResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SendRequest(
        [FromBody] UserConnectionRequestDTO dto, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new SendConnectionRequestCommand(dto, ActorId), ct);
        return CreatedAtAction(nameof(GetMyConnections), new { }, result);
    }

    /// <summary>
    /// Responds to a received connection request.
    /// Only the addressee can respond. Actions: Accept, Reject, Block.
    /// </summary>
    [HttpPut("connections/{connectionId:guid}/respond")]
    [ProducesResponseType(typeof(UserConnectionResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RespondToRequest(
        Guid connectionId, [FromBody] UserConnectionRespondDTO dto, CancellationToken ct = default)
        => Ok(await _mediator.Send(
            new RespondConnectionRequestCommand(connectionId, dto, ActorId), ct));

    /// <summary>
    /// Cancels a pending request (requester) or removes an accepted connection (either party).
    /// Admin can remove any connection.
    /// </summary>
    [HttpDelete("connections/{connectionId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteConnection(
        Guid connectionId, CancellationToken ct = default)
    {
        await _mediator.Send(new DeleteConnectionCommand(connectionId, ActorId, ActorRole), ct);
        return NoContent();
    }
}
