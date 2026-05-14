using Bio.Application.DTOs;
using Bio.Application.Features.Community.Messaging.Commands;
using Bio.Application.Features.Community.Messaging.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// Direct messaging: threads and messages.
/// All endpoints require authentication.
/// REST-based (no WebSocket). Polling-based read model.
/// </summary>
[ApiController]
[Route("api/v1/messaging")]
[Authorize]
[Produces("application/json")]
public class MessagingController : ControllerBase
{
    private readonly IMediator _mediator;

    public MessagingController(IMediator mediator) => _mediator = mediator;

    private Guid ActorId => Guid.Parse(
        User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException("User identity missing."));

    /// <summary>Returns the authenticated user's message threads (paginated).</summary>
    [HttpGet("threads")]
    [ProducesResponseType(typeof(PaginatedResult<DirectThreadSummaryDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyThreads(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await _mediator.Send(new GetMyThreadsQuery(ActorId, page, pageSize), ct));

    /// <summary>
    /// Creates a direct (1:1) or group thread.
    /// Direct threads between the same two users are deduplicated — returns existing.
    /// </summary>
    [HttpPost("threads")]
    [ProducesResponseType(typeof(DirectThreadSummaryDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateThread(
        [FromBody] CreateDirectThreadDTO dto, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new CreateDirectThreadCommand(dto, ActorId), ct);
        return CreatedAtAction(nameof(GetMyThreads), new { }, result);
    }

    /// <summary>Returns messages in a thread (paginated, newest first). Participant only.</summary>
    [HttpGet("threads/{threadId:guid}/messages")]
    [ProducesResponseType(typeof(PaginatedResult<DirectMessageResponseDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMessages(
        Guid threadId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken ct = default)
        => Ok(await _mediator.Send(
            new GetThreadMessagesQuery(threadId, ActorId, page, pageSize), ct));

    /// <summary>Sends a message to a thread. Participant only.</summary>
    [HttpPost("threads/{threadId:guid}/messages")]
    [ProducesResponseType(typeof(DirectMessageResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SendMessage(
        Guid threadId, [FromBody] SendDirectMessageDTO dto, CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new SendDirectMessageCommand(threadId, dto, ActorId), ct);
        return CreatedAtAction(nameof(GetMessages), new { threadId }, result);
    }

    /// <summary>Marks all unread messages in a thread as read. Participant only.</summary>
    [HttpPost("threads/{threadId:guid}/messages/read")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> MarkAsRead(
        Guid threadId, CancellationToken ct = default)
    {
        var count = await _mediator.Send(
            new MarkThreadMessagesReadCommand(threadId, ActorId), ct);
        return Ok(new { MarkedAsRead = count });
    }

    /// <summary>Returns total unread message count across all threads for the authenticated user.</summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(UnreadCountResponseDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct = default)
        => Ok(await _mediator.Send(new GetUnreadCountQuery(ActorId), ct));
}
