using Bio.Application.DTOs;
using Bio.Application.Features.Products.ProductCategories.Commands.CreateProductCategory;
using Bio.Application.Features.Products.ProductCategories.Queries.GetAllProductCategories;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductCategoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProductCategoriesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductCategoryResponseDTO>>> GetAll()
    {
        var result = await _mediator.Send(new GetAllProductCategoriesQuery());
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ProductCategoryResponseDTO>> Create([FromBody] ProductCategoryCreateDTO dto)
    {
        var result = await _mediator.Send(new CreateProductCategoryCommand(dto));
        return Ok(result);
    }
}
