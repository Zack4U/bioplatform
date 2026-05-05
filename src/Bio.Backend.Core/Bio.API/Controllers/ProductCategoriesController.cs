using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Bio.Application.DTOs;
using Bio.Application.Features.ProductCategories.Commands;
using Bio.Application.Features.ProductCategories.Queries;
using Bio.Domain.Constants;
using MediatR;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/product-categories")]
[Produces("application/json")]
public class ProductCategoriesController : ControllerBase
{
    private readonly IMediator _mediator;
    public ProductCategoriesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _mediator.Send(new GetAllProductCategoriesQuery()));

    [HttpPost]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> Create([FromBody] ProductCategoryCreateDTO dto)
    {
        var result = await _mediator.Send(new CreateProductCategoryCommand(dto));
        return CreatedAtAction(nameof(GetAll), result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] ProductCategoryUpdateDTO dto)
        => Ok(await _mediator.Send(new UpdateProductCategoryCommand(id, dto)));

    [HttpDelete("{id:int}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        await _mediator.Send(new DeleteProductCategoryCommand(id));
        return NoContent();
    }
}
