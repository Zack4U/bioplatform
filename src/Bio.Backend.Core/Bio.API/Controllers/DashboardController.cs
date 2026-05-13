using Bio.Application.DTOs;
using Bio.Application.Features.Dashboard.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// Dashboard endpoints — one per role, each returning role-specific KPIs.
/// </summary>
[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;
    public DashboardController(IMediator mediator) => _mediator = mediator;

    private Guid ActorId => Guid.Parse(User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identity missing."));
    private string ActorRole => User.FindFirstValue("role") ?? string.Empty;

    // =========================================================================
    // SELLER (backward-compatible legacy endpoint)
    // =========================================================================

    /// <summary>Returns seller KPIs (legacy — kept for compatibility).</summary>
    [HttpGet("seller")]
    [Authorize(Roles = "ENTREPRENEUR,ADMIN")]
    [ProducesResponseType(typeof(SellerDashboardDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSellerDashboard(
        [FromQuery] Guid? entrepreneurId, CancellationToken ct)
    {
        var targetId = ActorRole == "ADMIN" && entrepreneurId.HasValue
            ? entrepreneurId.Value : ActorId;
        return Ok(await _mediator.Send(new GetSellerDashboardQuery(targetId), ct));
    }

    /// <summary>Returns enhanced seller KPIs including revenue by category, ABS alerts, and certification compliance.</summary>
    [HttpGet("seller/enhanced")]
    [Authorize(Roles = "ENTREPRENEUR,ADMIN")]
    [ProducesResponseType(typeof(SellerDashboardEnhancedDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSellerDashboardEnhanced(
        [FromQuery] Guid? entrepreneurId,
        [FromQuery] int? year,
        [FromQuery] int? month,
        CancellationToken ct)
    {
        var targetId = ActorRole == "ADMIN" && entrepreneurId.HasValue
            ? entrepreneurId.Value : ActorId;
        return Ok(await _mediator.Send(new GetSellerDashboardEnhancedQuery(targetId, year, month), ct));
    }

    // =========================================================================
    // ADMIN
    // =========================================================================

    /// <summary>Returns platform-wide admin KPIs: users, marketplace, orders, compliance, and community.</summary>
    [HttpGet("admin")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(AdminDashboardDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminDashboard(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int topEntrepreneurs = 5,
        CancellationToken ct = default)
    {
        return Ok(await _mediator.Send(new GetAdminDashboardQuery(fromDate, toDate, topEntrepreneurs), ct));
    }

    // =========================================================================
    // RESEARCHER
    // =========================================================================

    /// <summary>Returns researcher KPIs: species catalog, image validation stats, geographic distribution.</summary>
    [HttpGet("researcher")]
    [Authorize(Roles = "RESEARCHER,ADMIN")]
    [ProducesResponseType(typeof(ResearcherDashboardDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetResearcherDashboard(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetResearcherDashboardQuery(ActorId), ct));
    }

    // =========================================================================
    // BUYER
    // =========================================================================

    /// <summary>Returns buyer KPIs: order history, spending, favorites, and reviews written.</summary>
    [HttpGet("buyer")]
    [Authorize(Roles = "BUYER,ADMIN")]
    [ProducesResponseType(typeof(BuyerDashboardDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBuyerDashboard(
        [FromQuery] Guid? buyerId,
        CancellationToken ct)
    {
        var targetId = ActorRole == "ADMIN" && buyerId.HasValue ? buyerId.Value : ActorId;
        return Ok(await _mediator.Send(new GetBuyerDashboardQuery(targetId), ct));
    }

    // =========================================================================
    // AUTHORITY
    // =========================================================================

    /// <summary>Returns authority KPIs: ABS permit compliance, certification audits, traceability batches.</summary>
    [HttpGet("authority")]
    [Authorize(Roles = "AUTHORITY,ADMIN")]
    [ProducesResponseType(typeof(AuthorityDashboardDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuthorityDashboard(
        [FromQuery] int expiryAlertDays = 90,
        CancellationToken ct = default)
    {
        return Ok(await _mediator.Send(new GetAuthorityDashboardQuery(expiryAlertDays), ct));
    }

    // =========================================================================
    // SOCIAL / COMMUNITY (all authenticated users)
    // =========================================================================

    /// <summary>Returns social/community KPIs for any authenticated user: posts, connections, messaging, and favorites.</summary>
    [HttpGet("social")]
    [ProducesResponseType(typeof(SocialDashboardDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSocialDashboard(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetSocialDashboardQuery(ActorId), ct));
    }
}
