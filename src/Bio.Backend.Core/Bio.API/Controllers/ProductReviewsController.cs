using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Bio.Application.DTOs;
using Bio.Application.Features.ProductReviews.Commands;
using Bio.Application.Features.ProductReviews.Queries;
using Bio.Domain.Constants;
using MediatR;
using System.Security.Claims;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/products/{productId:guid}/reviews")]
[Produces("application/json")]
public class ProductReviewsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ProductReviewsController(IMediator mediator) => _mediator = mediator;

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);
    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value ?? "";

    [HttpGet]
    public async Task<IActionResult> GetReviews(Guid productId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        => Ok(await _mediator.Send(new GetProductReviewsQuery(productId, page, pageSize)));

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(Guid productId, [FromBody] ProductReviewCreateDTO dto)
    {
        var result = await _mediator.Send(new CreateProductReviewCommand(productId, dto, GetUserId()));
        return CreatedAtAction(nameof(GetReviews), new { productId }, result);
    }

    [HttpPut("{reviewId:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid productId, Guid reviewId, [FromBody] ProductReviewUpdateDTO dto)
        => Ok(await _mediator.Send(new UpdateProductReviewCommand(reviewId, dto, GetUserId())));

    [HttpDelete("{reviewId:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid productId, Guid reviewId)
    {
        await _mediator.Send(new DeleteProductReviewCommand(reviewId, GetUserId(), GetUserRole()));
        return NoContent();
    }
}

/// <summary>
/// User-scoped reviews endpoint — returns all reviews written by the authenticated user.
/// Route: GET /api/reviews/my
/// </summary>
[ApiController]
[Route("api/reviews")]
[Authorize]
[Produces("application/json")]
public class ReviewsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ReviewsController(IMediator mediator) => _mediator = mediator;

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);
    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value ?? "";

    /// <summary>Returns a paginated list of reviews submitted by the authenticated user, with product context.</summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(PaginatedResult<MyReviewResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMy([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        => Ok(await _mediator.Send(new GetMyReviewsQuery(GetUserId(), page, pageSize)));

    /// <summary>
    /// Moderation list — Admin sees all reviews, Entrepreneur sees reviews scoped to their own products.
    /// Route: GET /api/reviews/manage
    /// </summary>
    [HttpGet("manage")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    [ProducesResponseType(typeof(PaginatedResult<ReviewManagedListItemDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetManaged([FromQuery] bool? isReported, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var role = GetUserRole();
        Guid? entrepreneurId = role == RoleNames.Entrepreneur ? GetUserId() : (Guid?)null;
        return Ok(await _mediator.Send(new GetManagedReviewsQuery(entrepreneurId, isReported, page, pageSize)));
    }

    /// <summary>
    /// Toggles the report flag on a review — Entrepreneur (own products) or Admin.
    /// Route: POST /api/reviews/{reviewId}/toggle-report
    /// </summary>
    [HttpPost("{reviewId:guid}/toggle-report")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    [ProducesResponseType(typeof(ReviewManagedListItemDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleReport(Guid reviewId, [FromBody] ToggleReviewReportDTO dto)
        => Ok(await _mediator.Send(new ToggleReviewReportCommand(reviewId, dto.Reason, GetUserId(), GetUserRole())));

    /// <summary>
    /// Deletes a review — Admin only, used for moderation cleanup.
    /// Route: DELETE /api/reviews/{reviewId}
    /// </summary>
    [HttpDelete("{reviewId:guid}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> DeleteManaged(Guid reviewId)
    {
        await _mediator.Send(new DeleteProductReviewCommand(reviewId, GetUserId(), GetUserRole()));
        return NoContent();
    }
}
