using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Bio.Application.DTOs;
using Bio.Application.Features.AbsPermits.Commands;
using Bio.Application.Features.AbsPermits.Queries;
using Bio.Domain.Constants;
using Bio.Domain.Interfaces;
using MediatR;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// ABS Permits management — Nagoya Protocol compliance.
/// Read: authenticated users (entrepreneurs see own, admin/authority see all).
/// Write: Admin and EnvironmentalAuthority only.
/// Revoke: Admin and EnvironmentalAuthority (soft-delete, never hard-delete).
/// </summary>
[ApiController]
[Route("api/v1/abs-permits")]
[Authorize]
[Produces("application/json")]
public class AbsPermitsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IS3StorageService _s3;

    public AbsPermitsController(IMediator mediator, IS3StorageService s3)
    { _mediator = mediator; _s3 = s3; }


    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException("User identity missing."));
    private string GetUserRole() => User.FindFirstValue("role") ?? string.Empty;

    /// <summary>Returns a specific ABS permit by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AbsPermitResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
        => Ok(await _mediator.Send(new GetAbsPermitByIdQuery(id), ct));

    /// <summary>Returns ABS permits for a specific entrepreneur. Entrepreneur can only see own.</summary>
    [HttpGet("entrepreneur/{entrepreneurId:guid}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority},{RoleNames.Entrepreneur}")]
    [ProducesResponseType(typeof(IReadOnlyList<AbsPermitResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByEntrepreneur(Guid entrepreneurId, CancellationToken ct = default)
    {
        if (GetUserRole() == RoleNames.Entrepreneur && entrepreneurId != GetUserId())
            return Forbid();
        return Ok(await _mediator.Send(new GetAbsPermitsByEntrepreneurQuery(entrepreneurId), ct));
    }

    /// <summary>
    /// Returns a paginated list of all ABS permits. Admin and EnvironmentalAuthority only.
    /// Optionally filter by entrepreneurId and/or status.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    [ProducesResponseType(typeof(PaginatedResult<AbsPermitResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? entrepreneurId,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await _mediator.Send(
            new GetAllAbsPermitsQuery(entrepreneurId, status, page, pageSize), ct));

    /// <summary>Creates a new ABS permit directly. Admin and EnvironmentalAuthority only.</summary>
    [HttpPost]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    [ProducesResponseType(typeof(AbsPermitResponseDTO), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] AbsPermitCreateDTO dto, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new CreateAbsPermitCommand(dto), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Submits a genetic-resource access request for a species (Status = "Pending").
    /// The official resolution data is filled in by the authority on approval.
    /// Entrepreneur only.
    /// </summary>
    [HttpPost("request")]
    [Authorize(Roles = RoleNames.Entrepreneur)]
    [ProducesResponseType(typeof(AbsPermitResponseDTO), StatusCodes.Status201Created)]
    public async Task<IActionResult> RequestPermit([FromBody] AbsPermitRequestDTO dto, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new RequestAbsPermitCommand(GetUserId(), dto), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Cancels (withdraws) the caller's own Pending permit request.
    /// Hard-delete is allowed only here — a Pending request is not yet an issued legal permit.
    /// Entrepreneur only.
    /// </summary>
    [HttpDelete("{id:guid}/request")]
    [Authorize(Roles = RoleNames.Entrepreneur)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelRequest(Guid id, CancellationToken ct = default)
    {
        await _mediator.Send(new CancelAbsPermitRequestCommand(id, GetUserId()), ct);
        return NoContent();
    }

    /// <summary>
    /// Approves a Pending request: assigns the official resolution data and activates the permit.
    /// Admin and EnvironmentalAuthority only.
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    [ProducesResponseType(typeof(AbsPermitResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveAbsPermitDTO dto, CancellationToken ct = default)
        => Ok(await _mediator.Send(new ApproveAbsPermitCommand(id, dto, GetUserId(), GetUserRole()), ct));

    /// <summary>
    /// Rejects a Pending request with a documented reason.
    /// Admin and EnvironmentalAuthority only.
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    [ProducesResponseType(typeof(AbsPermitResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectAbsPermitDTO dto, CancellationToken ct = default)
        => Ok(await _mediator.Send(new RejectAbsPermitCommand(id, dto, GetUserId(), GetUserRole()), ct));

    /// <summary>Updates an ABS permit. Admin and EnvironmentalAuthority only.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    [ProducesResponseType(typeof(AbsPermitResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] AbsPermitUpdateDTO dto, CancellationToken ct = default)
        => Ok(await _mediator.Send(new UpdateAbsPermitCommand(id, dto), ct));

    /// <summary>
    /// Revokes an ABS permit (soft-delete: Status = "Revoked").
    /// Hard-delete is NEVER permitted — ABS permits are immutable audit records per Nagoya Protocol.
    /// Admin and EnvironmentalAuthority only.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    [ProducesResponseType(typeof(AbsPermitResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Revoke(Guid id, CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new RevokeAbsPermitCommand(id, GetUserId(), GetUserRole()), ct);
        return Ok(result);
    }

    /// <summary>
    /// Uploads a permit PDF document to S3 and returns its public URL.
    /// Use this URL in DocumentUrl when creating or updating a permit.
    /// Admin and EnvironmentalAuthority only.
    /// </summary>
    [HttpPost("documents/upload")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadDocument(IFormFile file, CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "A PDF file is required." });
        if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase)
            && !file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only PDF files are accepted." });

        var fileName = $"permit_{Guid.NewGuid()}_{DateTime.UtcNow:yyyyMMdd}.pdf";
        var objectKey = $"permits/documents/{fileName}";

        await using var stream = file.OpenReadStream();
        var publicUrl = await _s3.UploadImageAsync(stream, objectKey, "application/pdf", ct);

        return Ok(new { documentUrl = publicUrl });
    }
}
