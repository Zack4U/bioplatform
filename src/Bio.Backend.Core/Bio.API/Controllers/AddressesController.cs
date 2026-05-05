using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Bio.Application.DTOs;
using Bio.Application.Features.Addresses.Commands;
using Bio.Application.Features.Addresses.Queries;
using MediatR;
using System.Security.Claims;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/addresses")]
[Authorize]
[Produces("application/json")]
public class AddressesController : ControllerBase
{
    private readonly IMediator _mediator;
    public AddressesController(IMediator mediator) => _mediator = mediator;

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);

    [HttpGet]
    public async Task<IActionResult> GetMine()
        => Ok(await _mediator.Send(new GetMyAddressesQuery(GetUserId())));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AddressCreateDTO dto)
    {
        var result = await _mediator.Send(new CreateAddressCommand(dto, GetUserId()));
        return CreatedAtAction(nameof(GetMine), result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AddressUpdateDTO dto)
        => Ok(await _mediator.Send(new UpdateAddressCommand(id, dto, GetUserId())));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteAddressCommand(id, GetUserId()));
        return NoContent();
    }
}
