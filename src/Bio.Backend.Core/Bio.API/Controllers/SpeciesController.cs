using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Bio.Application.DTOs;
using Bio.Application.Features.Species.Commands;
using Bio.Application.Features.Species.Commands.AddDistribution;
using Bio.Application.Features.Species.Commands.CreateSpecies;
using Bio.Application.Features.Species.Commands.DeleteSpecies;
using Bio.Application.Features.Species.Commands.UpdateSpecies;
using Bio.Application.Features.Species.Commands.UploadSpeciesObservation;
using Bio.Application.Features.Species.Queries.ExportSpecies;
using Bio.Application.Features.Species.Queries.ExportSpeciesImages;
using Bio.Application.Features.Species.Queries.GetAllSpecies;
using Bio.Application.Features.Species.Queries.GetSpeciesById;
using Bio.Application.Features.Species.Queries.GetSpeciesBySlug;
using Bio.Application.Features.Species.Queries.GetSpeciesDistributions;
using Bio.Application.Features.Species.Queries.GetSpeciesFilterMeta;
using Bio.Application.Features.Species.Queries.GetSpeciesImages;
using Bio.Domain.Constants;
using MediatR;
using System.Security.Claims;


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

    /// <summary>Lista especies con paginación, filtros y ordenamiento.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResult<SpeciesListItemDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] SpeciesFilterParams filters)
    {
        var result = await _mediator.Send(new GetAllSpeciesQuery
        {
            Query = filters.Query,
            Kingdom = filters.Kingdom,
            Phylum = filters.Phylum,
            ClassName = filters.ClassName,
            OrderName = filters.OrderName,
            Family = filters.Family,
            Genus = filters.Genus,
            IsSensitive = filters.IsSensitive,
            ConservationStatus = filters.ConservationStatus,
            Page = filters.Page,
            PageSize = filters.PageSize,
            SortBy = filters.SortBy,
            SortOrder = filters.SortOrder,
        });
        return Ok(result);
    }

    /// <summary>Obtiene los valores disponibles para filtros del catálogo (kingdoms, families, etc.).</summary>
    [HttpGet("filter-meta")]
    [ProducesResponseType(typeof(SpeciesFilterMetaDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFilterMeta()
    {
        var result = await _mediator.Send(new GetSpeciesFilterMetaQuery());
        return Ok(result);
    }

    /// <summary>Obtiene el detalle completo de una especie por id (incluye distribuciones y productos).</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SpeciesDetailDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userRole = GetUserRole();
        var result = await _mediator.Send(new GetSpeciesByIdQuery(id, userRole));
        return Ok(result);
    }

    /// <summary>Obtiene el detalle completo de una especie por slug (incluye distribuciones y productos).</summary>
    [HttpGet("slug/{slug}")]
    [ProducesResponseType(typeof(SpeciesDetailDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var userRole = GetUserRole();
        var result = await _mediator.Send(new GetSpeciesBySlugQuery(slug, userRole));
        return Ok(result);
    }

    /// <summary>Obtiene las distribuciones geográficas de una especie (coordenadas protegidas según rol).</summary>
    [HttpGet("{id:guid}/distributions")]
    [ProducesResponseType(typeof(IReadOnlyList<GeographicDistributionDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDistributions(Guid id)
    {
        var userRole = GetUserRole();
        var result = await _mediator.Send(new GetSpeciesDistributionsQuery(id, userRole));
        return Ok(result);
    }

    /// <summary>Obtiene las imágenes de una especie con paginación y filtro de validación.</summary>
    [HttpGet("{id:guid}/images")]
    [ProducesResponseType(typeof(PaginatedResult<SpeciesImageDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetImages(
        Guid id,
        [FromQuery] bool? onlyValidatedByExpert = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetSpeciesImagesQuery(id, onlyValidatedByExpert, page, pageSize));
        return Ok(result);
    }

    /// <summary>
    /// Exporta el catálogo COMPLETO de especies con detalle total, paginado por lotes,
    /// para sincronización offline. Coordenadas protegidas según rol.
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(typeof(PaginatedResult<SpeciesDetailDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Export(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userRole = GetUserRole();
        var result = await _mediator.Send(new ExportSpeciesQuery(page, pageSize, userRole));
        return Ok(result);
    }

    /// <summary>
    /// Exporta TODAS las imágenes del catálogo paginadas por lotes, para descarga offline.
    /// </summary>
    [HttpGet("images/export")]
    [ProducesResponseType(typeof(PaginatedResult<SpeciesImageDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportImages(
        [FromQuery] bool onlyValidatedByExpert = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _mediator.Send(
            new ExportSpeciesImagesQuery(onlyValidatedByExpert, page, pageSize));
        return Ok(result);
    }

    /// <summary>
    /// Contribuye una nueva observación fotográfica de una especie.
    /// Sube la imagen a S3 y registra los metadatos en la base de datos.
    /// Disponible para cualquier usuario autenticado, sin restricción de rol.
    /// </summary>
    [HttpPost("{id:guid}/observations")]
    [Authorize]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(SpeciesImageDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadObservation(
        Guid id,
        IFormFile file,
        [FromForm] UploadObservationRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(userIdClaim, out var uploaderUserId))
            return Unauthorized(new { error = "User identity could not be resolved from token." });

        if (file is null || file.Length == 0)
            return BadRequest(new { error = "An image file is required." });

        await using var fileStream = file.OpenReadStream();

        var command = new UploadSpeciesObservationCommand
        {
            SpeciesId = id,
            FileStream = fileStream,
            ContentType = file.ContentType,
            OriginalFileName = file.FileName,
            UploaderUserId = uploaderUserId,
            LicenseType = request.LicenseType,
            SourceType = request.SourceType,
            Device = request.Device,
            DeviceType = request.DeviceType,
            OperatingSystem = request.OperatingSystem,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            SpeciesPredicted = request.SpeciesPredicted,
            ConfidenceScore = request.ConfidenceScore,
            ModelVersion = request.ModelVersion,
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetImages), new { id }, result);
    }

    /// <summary>Crea una nueva especie.</summary>
    [HttpPost]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Researcher}")]
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
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Researcher}")]
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
    [Authorize(Roles = RoleNames.Admin)]
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
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Researcher}")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportCsv(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "A CSV file is required." });

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only CSV files are accepted." });

        var tempPath = Path.Combine(Path.GetTempPath(), $"bio-import-{Guid.NewGuid()}.csv");
        await using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Extract real userId from JWT claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        var userId = Guid.TryParse(userIdClaim, out var parsedId) ? parsedId : Guid.Empty;

        var jobId = await _mediator.Send(new ImportSpeciesCsvCommand
        {
            FilePath = tempPath,
            UserId = userId
        });

        return Accepted(new { jobId, message = "CSV import job enqueued successfully." });
    }

    /// <summary>
    /// Carga masiva de Potencial Económico desde un archivo JSON.
    /// El archivo debe seguir la estructura de species_economic_potential.json.
    /// Cada entrada se empareja por scientific_name y reemplaza los registros existentes.
    /// El proceso se ejecuta en segundo plano (Hangfire).
    /// </summary>
    [HttpPost("import-economic-potential")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Researcher}")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportEconomicPotential(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "A JSON file is required." });

        if (!file.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only JSON files are accepted." });

        var tempPath = Path.Combine(Path.GetTempPath(), $"bio-economic-{Guid.NewGuid()}.json");
        await using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        var userId = Guid.TryParse(userIdClaim, out var parsedId) ? parsedId : Guid.Empty;

        var jobId = await _mediator.Send(new ImportSpeciesEconomicPotentialCommand
        {
            FilePath = tempPath,
            UserId = userId
        });

        return Accepted(new
        {
            jobId,
            message = "Economic potential import job enqueued successfully.",
            hint = "Se actualizarán los registros de species_economic_potentials para cada especie encontrada."
        });
    }

    /// <summary>
    /// Carga masiva de Usos Tradicionales desde un archivo JSON.
    /// El archivo debe seguir la estructura de species_traditional_uses.json.
    /// Cada entrada se empareja por scientific_name y reemplaza los registros existentes.
    /// El proceso se ejecuta en segundo plano (Hangfire).
    /// </summary>
    [HttpPost("import-traditional-uses")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Researcher}")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportTraditionalUses(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "A JSON file is required." });

        if (!file.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only JSON files are accepted." });

        var tempPath = Path.Combine(Path.GetTempPath(), $"bio-traditional-{Guid.NewGuid()}.json");
        await using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        var userId = Guid.TryParse(userIdClaim, out var parsedId) ? parsedId : Guid.Empty;

        var jobId = await _mediator.Send(new ImportSpeciesTraditionalUsesCommand
        {
            FilePath = tempPath,
            UserId = userId
        });

        return Accepted(new
        {
            jobId,
            message = "Traditional uses import job enqueued successfully.",
            hint = "Se actualizarán los registros de species_traditional_uses para cada especie encontrada."
        });
    }

    // ── IMAGE VALIDATION ──────────────────────────────────────────────────────

    /// <summary>
    /// Validates a species image as an expert — marks IsValidatedByExpert = true.
    /// Restricted to Admin and Environmental Authority. Researchers have read-only AI access.
    /// </summary>
    [HttpPost("{speciesId:guid}/images/{imageId:guid}/validate")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    [ProducesResponseType(typeof(SpeciesImageDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ValidateImage(
        Guid speciesId, Guid imageId, CancellationToken ct = default)
    {
        var validatorId = GetActorId();
        var result = await _mediator.Send(new ValidateSpeciesImageCommand(imageId, validatorId), ct);
        return Ok(result);
    }

    /// <summary>
    /// Rejects (unvalidates) a species image — sets IsValidatedByExpert = false.
    /// Restricted to Admin and Environmental Authority. Researchers have read-only AI access.
    /// </summary>
    [HttpPost("{speciesId:guid}/images/{imageId:guid}/reject")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    [ProducesResponseType(typeof(SpeciesImageDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectImage(
        Guid speciesId, Guid imageId, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new RejectSpeciesImageCommand(imageId), ct);
        return Ok(result);
    }

    // ── GEOGRAPHIC DISTRIBUTIONS ──────────────────────────────────────────────

    /// <summary>
    /// Adds a geographic distribution point (coordinate) for a species.
    /// Restricted to Admin, Researcher, and EnvironmentalAuthority.
    /// Duplicate coordinates for the same species are rejected.
    /// Coordinates are masked in the response for sensitive species if caller lacks privileges.
    /// </summary>
    [HttpPost("{speciesId:guid}/distributions")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Researcher},{RoleNames.EnvironmentalAuthority}")]
    [ProducesResponseType(typeof(GeographicDistributionDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddDistribution(
        Guid speciesId,
        [FromBody] GeographicDistributionCreateDTO dto,
        CancellationToken ct = default)
    {
        var actorId = GetActorId();
        var userRole = GetUserRole() ?? string.Empty;
        var result = await _mediator.Send(
            new AddGeographicDistributionCommand(speciesId, dto, actorId, userRole), ct);
        return CreatedAtAction(nameof(GetDistributions), new { id = speciesId }, result);
    }

    /// <summary>
    /// Deletes (hard-delete) a geographic distribution record.
    /// Restricted to Admin, Researcher, and EnvironmentalAuthority.
    /// </summary>
    [HttpDelete("distributions/{distributionId:guid}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Researcher},{RoleNames.EnvironmentalAuthority}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDistribution(
        Guid distributionId, CancellationToken ct = default)
    {
        var actorId = GetActorId();
        var userRole = GetUserRole() ?? string.Empty;
        await _mediator.Send(
            new DeleteGeographicDistributionCommand(distributionId, actorId, userRole), ct);
        return NoContent();
    }

    /// <summary>
    /// Extrae el primer rol del usuario autenticado desde los claims JWT.
    /// Retorna null si no hay usuario autenticado.
    /// </summary>
    private string? GetUserRole()
    {
        if (User.Identity?.IsAuthenticated != true) return null;
        return User.FindFirstValue("role") ?? User.FindFirst(ClaimTypes.Role)?.Value;
    }

    private Guid GetActorId()
    {
        var claim = User.FindFirstValue("sub")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User identity missing.");
        return Guid.Parse(claim);
    }
}
