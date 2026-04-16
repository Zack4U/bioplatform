using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Species.Queries.GetSpeciesBySlug;

/// <summary>
/// Retorna el detalle completo de una especie por Slug:
/// taxonomía, distribuciones (protegidas según rol), y productos relacionados.
/// </summary>
public record GetSpeciesBySlugQuery(string Slug, string? UserRole = null) : IRequest<SpeciesDetailDTO>;

public class GetSpeciesBySlugQueryHandler : IRequestHandler<GetSpeciesBySlugQuery, SpeciesDetailDTO>
{
    private readonly ISpeciesRepository _speciesRepository;
    private readonly IGeographicDistributionRepository _distributionRepository;
    private readonly IRelatedProductsQuery _relatedProductsQuery;

    public GetSpeciesBySlugQueryHandler(
        ISpeciesRepository speciesRepository,
        IGeographicDistributionRepository distributionRepository,
        IRelatedProductsQuery relatedProductsQuery)
    {
        _speciesRepository = speciesRepository;
        _distributionRepository = distributionRepository;
        _relatedProductsQuery = relatedProductsQuery;
    }

    public async Task<SpeciesDetailDTO> Handle(GetSpeciesBySlugQuery request, CancellationToken cancellationToken)
    {
        var species = await _speciesRepository.GetBySlugWithDistributionsAsync(request.Slug, cancellationToken)
            ?? throw new Bio.Domain.Exceptions.NotFoundException($"Species with slug '{request.Slug}' not found.");

        return await BuildDetailDTO(species, request.UserRole, cancellationToken);
    }

    private async Task<SpeciesDetailDTO> BuildDetailDTO(
        Bio.Domain.Entities.Species species,
        string? userRole,
        CancellationToken cancellationToken)
    {
        var canSeeExactCoordinates = CanAccessSensitiveCoordinates(userRole);

        var distributions = species.GeographicDistributions
            .Select(d => MapDistribution(d, species.IsSensitive, canSeeExactCoordinates))
            .ToList();

        var relatedProducts = await _relatedProductsQuery
            .GetBySpeciesIdAsync(species.Id, cancellationToken);

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
            species.TraditionalUses,
            species.EconomicPotential,
            species.ConservationStatus,
            species.AltitudeRange,
            species.LegalStatus,
            species.IsSensitive,
            species.CreatedAt,
            species.UpdatedAt,
            distributions,
            relatedProducts);
    }

    private static bool CanAccessSensitiveCoordinates(string? userRole)
    {
        if (string.IsNullOrEmpty(userRole)) return false;
        return userRole is
            Bio.Domain.Constants.RoleNames.Admin or
            Bio.Domain.Constants.RoleNames.Researcher or
            Bio.Domain.Constants.RoleNames.EnvironmentalAuthority;
    }

    private static GeographicDistributionDTO MapDistribution(
        Bio.Domain.Entities.GeographicDistribution dist,
        bool isSensitive,
        bool canSeeExactCoordinates)
    {
        var shouldMask = isSensitive && !canSeeExactCoordinates;

        return new GeographicDistributionDTO(
            dist.Id,
            dist.SpeciesId,
            Latitude: shouldMask ? null : dist.Latitude,
            Longitude: shouldMask ? null : dist.Longitude,
            dist.Altitude,
            dist.Municipality,
            dist.EcosystemType,
            IsMasked: shouldMask
        );
    }
}
