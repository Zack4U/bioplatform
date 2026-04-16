using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Species.Queries.GetSpeciesDistributions;

/// <summary>
/// Obtiene las distribuciones geográficas de una especie.
/// Enmascara coordenadas si la especie es sensible y el usuario no tiene rol privilegiado.
/// </summary>
public record GetSpeciesDistributionsQuery(
    Guid SpeciesId,
    string? UserRole = null
) : IRequest<IReadOnlyList<GeographicDistributionDTO>>;

public class GetSpeciesDistributionsQueryHandler
    : IRequestHandler<GetSpeciesDistributionsQuery, IReadOnlyList<GeographicDistributionDTO>>
{
    private readonly ISpeciesRepository _speciesRepository;
    private readonly IGeographicDistributionRepository _distributionRepository;

    public GetSpeciesDistributionsQueryHandler(
        ISpeciesRepository speciesRepository,
        IGeographicDistributionRepository distributionRepository)
    {
        _speciesRepository = speciesRepository;
        _distributionRepository = distributionRepository;
    }

    public async Task<IReadOnlyList<GeographicDistributionDTO>> Handle(
        GetSpeciesDistributionsQuery request,
        CancellationToken cancellationToken)
    {
        var species = await _speciesRepository.GetByIdAsync(request.SpeciesId, cancellationToken)
            ?? throw new Bio.Domain.Exceptions.NotFoundException(
                $"Species with id {request.SpeciesId} not found.");

        var distributions = await _distributionRepository
            .GetBySpeciesIdAsync(request.SpeciesId, cancellationToken);

        var canSeeExactCoordinates = CanAccessSensitiveCoordinates(request.UserRole);

        return distributions
            .Select(d => MapDistribution(d, species.IsSensitive, canSeeExactCoordinates))
            .ToList();
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
