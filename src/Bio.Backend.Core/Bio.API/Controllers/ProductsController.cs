using Bio.Application.DTOs;
using Bio.Application.Features.Products.Commands.CreateProduct;
using Bio.Application.Features.Products.Commands.DeleteProduct;
using Bio.Application.Features.Products.Commands.UpdateProduct;
using Bio.Application.Features.Products.Queries.GetAllProducts;
using Bio.Application.Features.Products.Queries.GetProductById;
using Bio.Application.Features.Products.Queries.GetProductBySlug;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProductsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductResponseDTO>>> GetAll([FromQuery] int skip = 0, [FromQuery] int take = 10, [FromQuery] bool onlyActive = true)
    {
        var query = new GetAllProductsQuery(skip, take, onlyActive);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductResponseDTO>> GetById(Guid id)
    {
        var query = new GetProductByIdQuery(id);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<ProductResponseDTO>> GetBySlug(string slug)
    {
        var query = new GetProductBySlugQuery(slug);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ProductResponseDTO>> Create([FromBody] ProductCreateDTO dto)
    {
        var command = new CreateProductCommand(dto);
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProductResponseDTO>> Update(Guid id, [FromBody] ProductUpdateDTO dto)
    {
        var command = new UpdateProductCommand(id, dto);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var command = new DeleteProductCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
