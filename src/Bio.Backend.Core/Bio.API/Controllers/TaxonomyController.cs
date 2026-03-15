using Microsoft.AspNetCore.Mvc;
using Bio.Application.DTOs;
using Bio.Application.Features.Taxonomy.Commands.CreateTaxonomy;
using Bio.Application.Features.Taxonomy.Commands.DeleteTaxonomy;
using Bio.Application.Features.Taxonomy.Commands.UpdateTaxonomy;
using Bio.Application.Features.Taxonomy.Queries.GetAllTaxonomies;
using Bio.Application.Features.Taxonomy.Queries.GetTaxonomyById;
using MediatR;

namespace Bio.API.Controllers;

/// <summary>
/// CRUD de taxonomía (reino, filo, clase, orden, familia, género) para el catálogo científico.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class TaxonomyController : ControllerBase
{
    private readonly IMediator _mediator;

    public TaxonomyController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Obtiene todas las taxonomías.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TaxonomyResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetAllTaxonomiesQuery());
        return Ok(result);
    }

    /// <summary>Obtiene una taxonomía por id.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TaxonomyResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _mediator.Send(new GetTaxonomyByIdQuery(id));
        return Ok(result);
    }

    /// <summary>Crea una nueva taxonomía.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TaxonomyResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] TaxonomyCreateDTO dto)
    {
        var result = await _mediator.Send(new CreateTaxonomyCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Actualiza una taxonomía existente.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(TaxonomyResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] TaxonomyUpdateDTO dto)
    {
        var result = await _mediator.Send(new UpdateTaxonomyCommand(id, dto));
        return Ok(result);
    }

    /// <summary>Elimina una taxonomía.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        await _mediator.Send(new DeleteTaxonomyCommand(id));
        return NoContent();
    }
}
