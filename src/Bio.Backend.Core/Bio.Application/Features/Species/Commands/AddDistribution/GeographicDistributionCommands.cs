using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentValidation;
using MediatR;
using NetTopologySuite.Geometries;

namespace Bio.Application.Features.Species.Commands.AddDistribution;

// =============================================================================
// ADD GEOGRAPHIC DISTRIBUTION
// =============================================================================

public record AddGeographicDistributionCommand(
    Guid SpeciesId,
    GeographicDistributionCreateDTO Dto,
    Guid ActorId,
    string ActorRole) : IRequest<GeographicDistributionDTO>;

public class AddGeographicDistributionCommandHandler
    : IRequestHandler<AddGeographicDistributionCommand, GeographicDistributionDTO>
{
    private readonly IGeographicDistributionRepository _distributionRepo;
    private readonly ISpeciesRepository _speciesRepo;
    private readonly IScientificUnitOfWork _uow;

    public AddGeographicDistributionCommandHandler(
        IGeographicDistributionRepository distributionRepo,
        ISpeciesRepository speciesRepo,
        IScientificUnitOfWork uow)
    {
        _distributionRepo = distributionRepo;
        _speciesRepo = speciesRepo;
        _uow = uow;
    }

    public async Task<GeographicDistributionDTO> Handle(
        AddGeographicDistributionCommand request, CancellationToken ct)
    {
        // Only Researchers, Admin, and EnvironmentalAuthority can add distribution data
        var allowedRoles = new[] {
            Bio.Domain.Constants.RoleNames.Admin,
            Bio.Domain.Constants.RoleNames.Researcher,
            Bio.Domain.Constants.RoleNames.EnvironmentalAuthority
        };
        if (!allowedRoles.Contains(request.ActorRole))
            throw new ForbiddenException("Only researchers, admins, or environmental authorities can add distribution data.");

        var species = await _speciesRepo.GetByIdAsync(request.SpeciesId, ct)
            ?? throw new NotFoundException(nameof(Species), request.SpeciesId);

        // Prevent exact duplicate coordinates for same species
        var duplicate = await _distributionRepo.ExistsBySpeciesAndCoordinatesAsync(
            request.SpeciesId, request.Dto.Latitude, request.Dto.Longitude, ct);
        if (duplicate)
            throw new ConflictException(
                $"A distribution record already exists for species '{species.ScientificName}' at these coordinates.");

        // Build PostGIS Point
        var factory = new GeometryFactory(new PrecisionModel(), 4326);
        var point = factory.CreatePoint(
            new Coordinate(request.Dto.Longitude, request.Dto.Latitude));

        var distribution = new GeographicDistribution(
            request.SpeciesId,
            request.Dto.Latitude,
            request.Dto.Longitude,
            request.Dto.Altitude,
            request.Dto.Municipality,
            request.Dto.EcosystemType,
            point);

        await _distributionRepo.AddAsync(distribution, ct);
        await _uow.SaveChangesAsync(ct);

        // Respect bio-safety: mask coordinates for sensitive species if caller is not privileged
        bool canSeeExact = allowedRoles.Contains(request.ActorRole);
        bool shouldMask = species.IsSensitive && !canSeeExact;

        return new GeographicDistributionDTO(
            distribution.Id,
            distribution.SpeciesId,
            Latitude: shouldMask ? null : distribution.Latitude,
            Longitude: shouldMask ? null : distribution.Longitude,
            distribution.Altitude,
            distribution.Municipality,
            distribution.EcosystemType,
            IsMasked: shouldMask);
    }
}

public class AddGeographicDistributionCommandValidator
    : AbstractValidator<AddGeographicDistributionCommand>
{
    public AddGeographicDistributionCommandValidator()
    {
        RuleFor(x => x.Dto.Latitude)
            .InclusiveBetween(-90, 90).WithMessage("Latitude must be between -90 and 90.");

        RuleFor(x => x.Dto.Longitude)
            .InclusiveBetween(-180, 180).WithMessage("Longitude must be between -180 and 180.");

        RuleFor(x => x.Dto.Municipality)
            .MaximumLength(100).WithMessage("Municipality must not exceed 100 characters.")
            .When(x => x.Dto.Municipality != null);

        RuleFor(x => x.Dto.EcosystemType)
            .MaximumLength(100).WithMessage("EcosystemType must not exceed 100 characters.")
            .When(x => x.Dto.EcosystemType != null);
    }
}

// =============================================================================
// DELETE GEOGRAPHIC DISTRIBUTION
// =============================================================================

public record DeleteGeographicDistributionCommand(
    Guid DistributionId,
    Guid ActorId,
    string ActorRole) : IRequest<Unit>;

public class DeleteGeographicDistributionCommandHandler
    : IRequestHandler<DeleteGeographicDistributionCommand, Unit>
{
    private readonly IGeographicDistributionRepository _distributionRepo;
    private readonly IScientificUnitOfWork _uow;

    public DeleteGeographicDistributionCommandHandler(
        IGeographicDistributionRepository distributionRepo,
        IScientificUnitOfWork uow)
    {
        _distributionRepo = distributionRepo;
        _uow = uow;
    }

    public async Task<Unit> Handle(
        DeleteGeographicDistributionCommand request, CancellationToken ct)
    {
        var allowedRoles = new[] {
            Bio.Domain.Constants.RoleNames.Admin,
            Bio.Domain.Constants.RoleNames.Researcher,
            Bio.Domain.Constants.RoleNames.EnvironmentalAuthority
        };
        if (!allowedRoles.Contains(request.ActorRole))
            throw new ForbiddenException("Only researchers, admins, or environmental authorities can delete distribution data.");

        var distribution = await _distributionRepo.GetByIdAsync(request.DistributionId, ct)
            ?? throw new NotFoundException(nameof(GeographicDistribution), request.DistributionId);

        await _distributionRepo.DeleteAsync(distribution, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
