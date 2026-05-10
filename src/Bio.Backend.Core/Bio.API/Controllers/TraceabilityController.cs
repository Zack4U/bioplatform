using Bio.Application.DTOs;
using Bio.Application.Features.Traceability.Commands;
using Bio.Application.Features.Traceability.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// Traceability batches for products. Fulfills ABS / Nagoya protocol origin requirements.
/// Entrepreneurs manage batches for their own products. Admin manages all.
/// Public endpoint allows consumers to verify product origin.
/// </summary>
[ApiController]
[Route("api/v1")]
public class TraceabilityController : ControllerBase
{
    private readonly IMediator _mediator;
    public TraceabilityController(IMediator mediator) => _mediator = mediator;

    private Guid ActorId => Guid.Parse(User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identity missing."));
    private string ActorRole => User.FindFirstValue("role") ?? string.Empty;

    // ── Public ────────────────────────────────────────────────────────────────

    /// <summary>Returns all traceability batches for a product (public, no auth required).</summary>
    [HttpGet("products/{productId:guid}/traceability")]
    [ProducesResponseType(typeof(IReadOnlyList<TraceabilityBatchResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByProduct(Guid productId, CancellationToken ct)
        => Ok(await _mediator.Send(new GetBatchesByProductQuery(productId), ct));

    /// <summary>Returns a single traceability batch by ID.</summary>
    [HttpGet("traceability/{batchId:guid}")]
    [ProducesResponseType(typeof(TraceabilityBatchResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid batchId, CancellationToken ct)
        => Ok(await _mediator.Send(new GetBatchByIdQuery(batchId), ct));

    // ── Authenticated ─────────────────────────────────────────────────────────

    /// <summary>Creates a traceability batch for a product (Entrepreneur/Admin only).</summary>
    [Authorize(Roles = "ENTREPRENEUR,ADMIN")]
    [HttpPost("products/{productId:guid}/traceability")]
    [ProducesResponseType(typeof(TraceabilityBatchResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(Guid productId, [FromBody] TraceabilityBatchCreateDTO dto, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateTraceabilityBatchCommand(productId, dto, ActorId, ActorRole), ct);
        return CreatedAtAction(nameof(GetById), new { batchId = result.Id }, result);
    }

    /// <summary>Updates a traceability batch (Entrepreneur/Admin only).</summary>
    [Authorize(Roles = "ENTREPRENEUR,ADMIN")]
    [HttpPut("traceability/{batchId:guid}")]
    [ProducesResponseType(typeof(TraceabilityBatchResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid batchId, [FromBody] TraceabilityBatchUpdateDTO dto, CancellationToken ct)
        => Ok(await _mediator.Send(new UpdateTraceabilityBatchCommand(batchId, dto, ActorId, ActorRole), ct));

    /// <summary>Deletes a traceability batch (Entrepreneur/Admin only).</summary>
    [Authorize(Roles = "ENTREPRENEUR,ADMIN")]
    [HttpDelete("traceability/{batchId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid batchId, CancellationToken ct)
    {
        await _mediator.Send(new DeleteTraceabilityBatchCommand(batchId, ActorId, ActorRole), ct);
        return NoContent();
    }
}
