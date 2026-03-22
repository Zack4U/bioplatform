using Microsoft.AspNetCore.Mvc;
using Bio.Application.DTOs;
using Bio.Application.Features.Species.Commands;
using Bio.Application.Features.Species.Commands.CreateSpecies;
using Bio.Application.Features.Species.Commands.DeleteSpecies;
using Bio.Application.Features.Species.Commands.UpdateSpecies;
using Bio.Application.Features.Species.Queries.GetAllSpecies;
using Bio.Application.Features.Species.Queries.GetSpeciesById;
using Bio.Application.Features.Species.Queries.GetSpeciesBySlug;
using MediatR;

namespace Bio.API.Controllers;

/// <summary>
/// CRUD de especies del catálogo de biodiversidad (taxonomía completa).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SpeciesController : ControllerBase
{
    private readonly IMediator _mediator;

    public SpeciesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Lista especies con paginación opcional (skip, take).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<SpeciesResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] int? skip, [FromQuery] int? take)
    {
        var result = await _mediator.Send(new GetAllSpeciesQuery(skip, take));
        return Ok(result);
    }

    /// <summary>Obtiene una especie por id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SpeciesResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetSpeciesByIdQuery(id));
        return Ok(result);
    }

    /// <summary>Obtiene una especie por slug.</summary>
    [HttpGet("slug/{slug}")]
    [ProducesResponseType(typeof(SpeciesResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var result = await _mediator.Send(new GetSpeciesBySlugQuery(slug));
        return Ok(result);
    }

    /// <summary>Crea una nueva especie.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(SpeciesResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] SpeciesCreateDTO dto)
    {
        var result = await _mediator.Send(new CreateSpeciesCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Actualiza una especie existente.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(SpeciesResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, [FromBody] SpeciesUpdateDTO dto)
    {
        var result = await _mediator.Send(new UpdateSpeciesCommand(id, dto));
        return Ok(result);
    }

    /// <summary>Elimina una especie.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteSpeciesCommand(id));
        return NoContent();
    }

    /// <summary>
    /// Carga masiva de especies desde un archivo CSV.
    /// El archivo se procesa en segundo plano (Hangfire).
    /// </summary>
    [HttpPost("import-csv")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportCsv(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "A CSV file is required." });

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only CSV files are accepted." });

        // Save the file to a temporary location
        var tempPath = Path.Combine(Path.GetTempPath(), $"bio-import-{Guid.NewGuid()}.csv");
        await using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // TODO: Extract real userId from JWT claims once auth is wired.
        var userId = Guid.Empty;

        var jobId = await _mediator.Send(new ImportSpeciesCsvCommand
        {
            FilePath = tempPath,
            UserId = userId
        });

        return Accepted(new { jobId, message = "CSV import job enqueued successfully." });
    }
}

