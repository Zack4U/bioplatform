using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Bio.Application.DTOs;
using Bio.Application.Features.Orders.Commands;
using Bio.Application.Features.Orders.Queries;
using Bio.Domain.Constants;
using MediatR;
using System.Security.Claims;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
[Produces("application/json")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    public OrdersController(IMediator mediator) => _mediator = mediator;

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);
    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value ?? "";

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OrderCreateDTO dto)
    {
        try
        {
            var result = await _mediator.Send(new CreateOrderCommand(dto, GetUserId()));
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            System.IO.File.WriteAllText(@"c:\Users\juanp\OneDrive\Desktop\Proyecto Integrador\bioplatform\src\Bio.Backend.Core\Bio.API\error_log_orders.txt", ex.ToString());
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
        => Ok(await _mediator.Send(new GetOrderByIdQuery(id, GetUserId(), GetUserRole())));

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        => Ok(await _mediator.Send(new GetMyOrdersQuery(GetUserId(), page, pageSize)));

    [HttpGet("manage")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> GetManaged([FromQuery] OrderFilterParams filters)
        => Ok(await _mediator.Send(new GetManagedOrdersQuery(filters.Status, filters.Page, filters.PageSize)));

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] OrderUpdateStatusDTO dto)
        => Ok(await _mediator.Send(new UpdateOrderStatusCommand(id, dto.Status)));

    [HttpPost("{id:guid}/checkout-session")]
    public async Task<IActionResult> CreateCheckoutSession(Guid id, [FromQuery] string? returnUrl)
    {
        try
        {
            // Provide a default return URL if none is provided.
            string defaultReturnUrl = "http://localhost:3000/cart/success?orderId=" + id.ToString();
            var url = string.IsNullOrWhiteSpace(returnUrl) ? defaultReturnUrl : returnUrl;

            return Ok(await _mediator.Send(new CreateCheckoutSessionCommand(id, GetUserId(), url)));
        }
        catch (Exception ex)
        {
            System.IO.File.WriteAllText(@"c:\Users\juanp\OneDrive\Desktop\Proyecto Integrador\bioplatform\src\Bio.Backend.Core\Bio.API\error_log_stripe.txt", ex.ToString());
            return StatusCode(500, ex.Message);
        }
    }
}
