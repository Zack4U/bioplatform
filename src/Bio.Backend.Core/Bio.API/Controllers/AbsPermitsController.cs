using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Bio.Application.DTOs;
using Bio.Application.Features.AbsPermits.Commands;
using Bio.Application.Features.AbsPermits.Queries;
using Bio.Domain.Constants;
using MediatR;
using System.Security.Claims;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/abs-permits")]
[Authorize]
[Produces("application/json")]
public class AbsPermitsController : ControllerBase
{
    private readonly IMediator _mediator;
    public AbsPermitsController(IMediator mediator) => _mediator = mediator;

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);
    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value ?? "";

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
        => Ok(await _mediator.Send(new GetAbsPermitByIdQuery(id)));

    [HttpGet("entrepreneur/{entrepreneurId:guid}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority},{RoleNames.Entrepreneur}")]
    public async Task<IActionResult> GetByEntrepreneur(Guid entrepreneurId)
    {
        var role = GetUserRole();
        if (role == RoleNames.Entrepreneur && entrepreneurId != GetUserId())
            return Forbid();
        return Ok(await _mediator.Send(new GetAbsPermitsByEntrepreneurQuery(entrepreneurId)));
    }

    [HttpPost]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    public async Task<IActionResult> Create([FromBody] AbsPermitCreateDTO dto)
    {
        var result = await _mediator.Send(new CreateAbsPermitCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AbsPermitUpdateDTO dto)
        => Ok(await _mediator.Send(new UpdateAbsPermitCommand(id, dto)));
}
