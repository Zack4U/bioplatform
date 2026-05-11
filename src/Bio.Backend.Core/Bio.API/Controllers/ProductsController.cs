using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Bio.Application.DTOs;
using Bio.Application.Features.Products.Queries;
using MediatR;

namespace Bio.API.Controllers;

/// <summary>Public product endpoints — only active products visible.</summary>
[ApiController]
[Route("api/products")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ProductsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResult<ProductListItemDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] ProductFilterParams filters)
        => Ok(await _mediator.Send(new GetPublicProductsQuery
        {
            Query = filters.Query, CategoryId = filters.CategoryId, BaseSpeciesId = filters.BaseSpeciesId,
            MinPrice = filters.MinPrice, MaxPrice = filters.MaxPrice,
            SortBy = filters.SortBy, SortOrder = filters.SortOrder,
            Page = filters.Page, PageSize = filters.PageSize,
        }));

    [HttpGet("filter-meta")]
    [ProducesResponseType(typeof(ProductFilterMetaDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFilterMeta()
        => Ok(await _mediator.Send(new GetProductFilterMetaQuery()));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductDetailDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
        => Ok(await _mediator.Send(new GetProductByIdQuery(id)));

    [HttpGet("slug/{slug}")]
    [ProducesResponseType(typeof(ProductDetailDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug)
        => Ok(await _mediator.Send(new GetProductBySlugQuery(slug)));

    /// <summary>
    /// Returns up to <paramref name="limit"/> active products related to the given product.
    /// Similarity is determined by category first, then biological species.
    /// </summary>
    [HttpGet("{id:guid}/related")]
    [ProducesResponseType(typeof(IReadOnlyList<ProductListItemDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRelated(Guid id, [FromQuery] int limit = 6)
        => Ok(await _mediator.Send(new GetRelatedProductsQuery(id, Math.Clamp(limit, 1, 12))));
}
