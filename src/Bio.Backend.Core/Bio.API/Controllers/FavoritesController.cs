using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Bio.Application.DTOs;
using Bio.Application.Features.Favorites.Commands;
using Bio.Application.Features.Favorites.Queries;
using MediatR;
using System.Security.Claims;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/favorites")]
[Authorize]
[Produces("application/json")]
public class FavoritesController : ControllerBase
{
    private readonly IMediator _mediator;
    public FavoritesController(IMediator mediator) => _mediator = mediator;

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);

    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] string? targetType, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        => Ok(await _mediator.Send(new GetMyFavoritesQuery(GetUserId(), targetType, page, pageSize)));

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] FavoriteCreateDTO dto)
    {
        var result = await _mediator.Send(new AddFavoriteCommand(dto, GetUserId()));
        return CreatedAtAction(nameof(GetMine), result);
    }

    /// <summary>
    /// Toggles a product's favourite status for the authenticated user.
    /// Returns { productId, isFavorite } — matching the frontend FavoriteStatus type.
    /// </summary>
    [HttpPost("{productId:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid productId)
    {
        var result = await _mediator.Send(new ToggleFavoriteCommand(productId, GetUserId()));
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remove(Guid id)
    {
        await _mediator.Send(new RemoveFavoriteCommand(id, GetUserId()));
        return NoContent();
    }
}
