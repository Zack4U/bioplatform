using Bio.Application.DTOs;
using Bio.Application.Features.Certifications.Commands;
using Bio.Application.Features.Certifications.Queries;
using Bio.Domain.Constants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// Product certifications management.
/// Public read. Create/Update/Delete restricted to ENTREPRENEUR (own products) and ADMIN.
/// </summary>
[ApiController]
[Route("api/v1")]
[Produces("application/json")]
public class CertificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CertificationsController(IMediator mediator) => _mediator = mediator;

    private Guid ActorId => Guid.Parse(
        User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException("User identity missing."));
    private string ActorRole => User.FindFirstValue("role") ?? string.Empty;

    /// <summary>Returns all certifications for a product. Public.</summary>
    [HttpGet("products/{productId:guid}/certifications")]
    [ProducesResponseType(typeof(IReadOnlyList<CertificationResponseDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductCertifications(
        Guid productId, CancellationToken ct = default)
        => Ok(await _mediator.Send(new GetProductCertificationsQuery(productId), ct));

    /// <summary>Returns a single certification by ID. Public.</summary>
    [HttpGet("certifications/{certId:guid}")]
    [ProducesResponseType(typeof(CertificationResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCertificationById(
        Guid certId, CancellationToken ct = default)
        => Ok(await _mediator.Send(new GetCertificationByIdQuery(certId), ct));

    /// <summary>
    /// Adds a certification to a product.
    /// Restricted to ENTREPRENEUR (must own the product) and ADMIN.
    /// </summary>
    [HttpPost("products/{productId:guid}/certifications")]
    [Authorize(Roles = $"{RoleNames.Entrepreneur},{RoleNames.Admin}")]
    [ProducesResponseType(typeof(CertificationResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateCertification(
        Guid productId, [FromBody] CertificationCreateDTO dto, CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new CreateCertificationCommand(productId, dto, ActorId, ActorRole), ct);
        return CreatedAtAction(
            nameof(GetCertificationById), new { certId = result.Id }, result);
    }

    /// <summary>
    /// Updates a certification.
    /// Restricted to ENTREPRENEUR (must own the product) and ADMIN.
    /// </summary>
    [HttpPut("certifications/{certId:guid}")]
    [Authorize(Roles = $"{RoleNames.Entrepreneur},{RoleNames.Admin}")]
    [ProducesResponseType(typeof(CertificationResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCertification(
        Guid certId, [FromBody] CertificationUpdateDTO dto, CancellationToken ct = default)
        => Ok(await _mediator.Send(
            new UpdateCertificationCommand(certId, dto, ActorId, ActorRole), ct));

    /// <summary>
    /// Deletes a certification.
    /// Restricted to ENTREPRENEUR (must own the product) and ADMIN.
    /// </summary>
    [HttpDelete("certifications/{certId:guid}")]
    [Authorize(Roles = $"{RoleNames.Entrepreneur},{RoleNames.Admin}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCertification(
        Guid certId, CancellationToken ct = default)
    {
        await _mediator.Send(new DeleteCertificationCommand(certId, ActorId, ActorRole), ct);
        return NoContent();
    }
}
