using Bio.Application.DTOs;
using Bio.Application.Features.Notifications.Commands;
using Bio.Application.Features.Notifications.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// In-app notifications for the authenticated user.
/// </summary>
[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;
    public NotificationsController(IMediator mediator) => _mediator = mediator;

    private Guid ActorId => Guid.Parse(User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identity missing."));
    private string ActorRole => User.FindFirstValue("role") ?? string.Empty;

    /// <summary>Returns paginated notifications for the authenticated user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResult<NotificationResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyNotifications(
        [FromQuery] bool? isRead,
        [FromQuery] string? notificationType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        return Ok(await _mediator.Send(
            new GetMyNotificationsQuery(ActorId, isRead, notificationType, page, pageSize), ct));
    }

    /// <summary>Returns count of unread notifications for the authenticated user.</summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(UnreadNotificationCountDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetUnreadNotificationCountQuery(ActorId), ct));
    }

    /// <summary>Marks a specific notification as read.</summary>
    [HttpPut("{id:guid}/read")]
    [ProducesResponseType(typeof(NotificationResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new MarkNotificationAsReadCommand(id, ActorId), ct));
    }

    /// <summary>Marks all unread notifications for the authenticated user as read.</summary>
    [HttpPut("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        await _mediator.Send(new MarkAllNotificationsReadCommand(ActorId), ct);
        return NoContent();
    }

    /// <summary>Deletes a notification. Admins can delete any; users only their own.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteNotificationCommand(id, ActorId, ActorRole), ct);
        return NoContent();
    }
}
