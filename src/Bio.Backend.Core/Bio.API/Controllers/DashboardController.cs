using Bio.Application.DTOs;
using Bio.Application.Features.Dashboard.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// Seller dashboard — aggregated KPIs for entrepreneurs.
/// </summary>
[ApiController]
[Route("api/v1/dashboard")]
[Authorize(Roles = "ENTREPRENEUR,ADMIN")]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;
    public DashboardController(IMediator mediator) => _mediator = mediator;

    private Guid ActorId => Guid.Parse(User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identity missing."));
    private string ActorRole => User.FindFirstValue("role") ?? string.Empty;

    /// <summary>
    /// Returns seller KPIs: total sales, orders by status, top 5 products,
    /// average rating, and low-stock alerts.
    /// Admins can query any seller by providing entrepreneurId query param;
    /// entrepreneurs always see their own dashboard.
    /// </summary>
    [HttpGet("seller")]
    [ProducesResponseType(typeof(SellerDashboardDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetSellerDashboard(
        [FromQuery] Guid? entrepreneurId,
        CancellationToken ct)
    {
        // Admin can query any seller; entrepreneur always sees own dashboard
        var targetId = ActorRole == "ADMIN" && entrepreneurId.HasValue
            ? entrepreneurId.Value
            : ActorId;

        return Ok(await _mediator.Send(new GetSellerDashboardQuery(targetId), ct));
    }
}
