using Bio.Application.DTOs;
using Bio.Application.Features.Cart.Commands;
using Bio.Application.Features.Cart.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// Shopping cart management. One cart per authenticated user.
/// Prices are NOT stored in cart — resolved at checkout from current product prices.
/// </summary>
[ApiController]
[Route("api/v1/cart")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly IMediator _mediator;
    public CartController(IMediator mediator) => _mediator = mediator;

    private Guid UserId => Guid.Parse(User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identity missing."));

    /// <summary>Gets the current user's cart. Returns 204 if no cart exists yet.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(CartResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCartQuery(UserId), ct);
        if (result is null) return NoContent();
        return Ok(result);
    }

    /// <summary>
    /// Adds a product to the cart or increments its quantity if already present.
    /// </summary>
    [HttpPost("items")]
    [ProducesResponseType(typeof(CartResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddItem([FromBody] CartItemAddDTO dto, CancellationToken ct)
        => Ok(await _mediator.Send(new AddCartItemCommand(UserId, dto), ct));

    /// <summary>Updates the quantity of an existing cart item.</summary>
    [HttpPut("items/{itemId:guid}")]
    [ProducesResponseType(typeof(CartResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItem(Guid itemId, [FromBody] CartItemUpdateDTO dto, CancellationToken ct)
        => Ok(await _mediator.Send(new UpdateCartItemCommand(UserId, itemId, dto), ct));

    /// <summary>
    /// Toggles an item between active (selected for checkout) and inactive (saved for later).
    /// </summary>
    [HttpPost("items/{itemId:guid}/toggle")]
    [ProducesResponseType(typeof(CartResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleItem(Guid itemId, CancellationToken ct)
        => Ok(await _mediator.Send(new ToggleCartItemCommand(UserId, itemId), ct));

    /// <summary>Removes an item from the cart permanently.</summary>
    [HttpDelete("items/{itemId:guid}")]
    [ProducesResponseType(typeof(CartResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveItem(Guid itemId, CancellationToken ct)
        => Ok(await _mediator.Send(new RemoveCartItemCommand(UserId, itemId), ct));

    /// <summary>Removes ALL items from the cart.</summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Clear(CancellationToken ct)
    {
        await _mediator.Send(new ClearCartCommand(UserId), ct);
        return NoContent();
    }
}
