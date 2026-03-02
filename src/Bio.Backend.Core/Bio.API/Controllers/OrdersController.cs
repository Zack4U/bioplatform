using Bio.Application.Orders.Commands.CreateOrder;
using Bio.Application.Orders.Common;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<OrderResponseDto>> CreateOrder([FromBody] CreateOrderCommand command)
    {
        // El command ahora mapea 'buyerId', 'currency' e 'items' automáticamente
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}