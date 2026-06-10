using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Species.Queries.ExportSpecies;

/// <summary>
/// Exportación paginada del catálogo COMPLETO de especies (detalle total) para
/// sincronización offline: taxonomía, distribuciones (protegidas según rol),
/// potenciales económicos y usos tradicionales. No incluye productos relacionados
/// (no son necesarios para el catálogo científico offline).
/// </summary>
public record ExportSpeciesQuery(
    int Page = 1,
    int PageSize = 50,
    string? UserRole = null
) : IRequest<PaginatedResult<SpeciesDetailDTO>>;

public class ExportSpeciesQueryHandler
    : IRequestHandler<ExportSpeciesQuery, PaginatedResult<SpeciesDetailDTO>>
{
    private readonly ISpeciesRepository _speciesRepository;

    public ExportSpeciesQueryHandler(ISpeciesRepository speciesRepository)
    {
        _speciesRepository = speciesRepository;
    }

    public async Task<PaginatedResult<SpeciesDetailDTO>> Handle(
        ExportSpeciesQuery request,
        CancellationToken cancellationToken)
    {
        var (items, totalCount) = await _speciesRepository.GetPagedWithDetailsAsync(
            request.Page,
            request.PageSize,
            cancellationToken);

        var canSeeExactCoordinates = CanAccessSensitiveCoordinates(request.UserRole);

        var dtos = items.Select(s => MapDetail(s, canSeeExactCoordinates)).ToList();

        return PaginatedResult<SpeciesDetailDTO>.Create(
            dtos,
            totalCount,
            request.Page,
            request.PageSize);
    }

    private static SpeciesDetailDTO MapDetail(
        Bio.Domain.Entities.Species species,
        bool canSeeExactCoordinates)
    {
        var taxonomyDto = species.Taxonomy != null
            ? new TaxonomyResponseDTO(
                species.Taxonomy.Id,
                species.Taxonomy.Kingdom,
                species.Taxonomy.Phylum,
                species.Taxonomy.ClassName,
                species.Taxonomy.OrderName,
                species.Taxonomy.Family,
                species.Taxonomy.Genus)
            : null;

        var shouldMask = species.IsSensitive && !canSeeExactCoordinates;

        var distributions = species.GeographicDistributions
            .Select(d => new GeographicDistributionDTO(
                d.Id,
                d.SpeciesId,
                Latitude: shouldMask ? null : d.Latitude,
                Longitude: shouldMask ? null : d.Longitude,
                d.Altitude,
                d.Municipality,
                d.EcosystemType,
                IsMasked: shouldMask))
            .ToList();

        var economicPotentials = species.EconomicPotentials
            .Select(ep => new SpeciesEconomicPotentialDTO(
                ep.Id,
                ep.SpeciesId,
                ep.Sector,
                ep.Products.ToList(),
                ep.ActiveProperties?.ToList(),
                ep.Description,
                ep.MarketValue,
                ep.SustainabilityLevel,
                ep.Confidence,
                ep.CreatedAt))
            .ToList();

        var traditionalUses = species.TraditionalUses
            .Select(tu => new SpeciesTraditionalUseDTO(
                tu.Id,
                tu.SpeciesId,
                tu.Part,
                tu.Category.ToList(),
                tu.SpecificPurpose,
                tu.PreparationMethod,
                tu.Description,
                tu.Community,
                tu.TraditionalWarnings,
                tu.Confidence,
                tu.CreatedAt))
            .ToList();

        return new SpeciesDetailDTO(
            species.Id,
            species.TaxonomyId,
            taxonomyDto,
            species.Slug,
            species.ThumbnailUrl,
            species.ScientificName,
            species.CommonName,
            species.Description,
            species.EcologicalInfo,
            species.ConservationStatus,
            species.AltitudeRange,
            species.LegalStatus,
            species.IsSensitive,
            species.CreatedAt,
            species.UpdatedAt,
            distributions,
            economicPotentials,
            traditionalUses,
            new List<RelatedProductDTO>());
    }

    /// <summary>
    /// Roles privilegiados que pueden ver coordenadas exactas de especies sensibles.
    /// </summary>
    private static bool CanAccessSensitiveCoordinates(string? userRole)
    {
        if (string.IsNullOrEmpty(userRole)) return false;
        return userRole is
            Bio.Domain.Constants.RoleNames.Admin or
            Bio.Domain.Constants.RoleNames.Researcher or
            Bio.Domain.Constants.RoleNames.EnvironmentalAuthority;
    }
}
