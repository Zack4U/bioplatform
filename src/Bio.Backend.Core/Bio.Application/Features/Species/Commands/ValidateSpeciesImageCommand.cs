using Bio.Application.DTOs;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Species.Commands;

/// <summary>
/// Marks a species observation image as validated by an expert.
/// Only ADMIN and RESEARCHER roles may validate images.
/// </summary>
public record ValidateSpeciesImageCommand(
    Guid ImageId,
    Guid ValidatorUserId) : IRequest<SpeciesImageDTO>;

public class ValidateSpeciesImageCommandHandler
    : IRequestHandler<ValidateSpeciesImageCommand, SpeciesImageDTO>
{
    private readonly ISpeciesImageRepository _imageRepo;
    private readonly IScientificUnitOfWork _uow;

    public ValidateSpeciesImageCommandHandler(
        ISpeciesImageRepository imageRepo,
        IScientificUnitOfWork uow)
    {
        _imageRepo = imageRepo;
        _uow = uow;
    }

    public async Task<SpeciesImageDTO> Handle(ValidateSpeciesImageCommand request, CancellationToken ct)
    {
        var image = await _imageRepo.GetByIdAsync(request.ImageId, ct)
            ?? throw new NotFoundException(nameof(SpeciesImage), request.ImageId);

        image.Validate(request.ValidatorUserId);
        await _uow.SaveChangesAsync(ct);

        return new SpeciesImageDTO(
            image.Id, image.SpeciesId, image.ImageUrl, image.ThumbnailUrl,
            image.IsPrimary, image.IsValidatedByExpert, image.LicenseType, image.CreatedAt);
    }
}
