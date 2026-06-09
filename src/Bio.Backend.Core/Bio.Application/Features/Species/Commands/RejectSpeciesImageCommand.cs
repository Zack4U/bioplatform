using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Species.Commands;

/// <summary>
/// Reverts expert validation on a species observation image (reject).
/// Sets IsValidatedByExpert = false and clears validator info.
/// Only ADMIN and RESEARCHER roles may reject images.
/// </summary>
public record RejectSpeciesImageCommand(Guid ImageId) : IRequest<SpeciesImageDTO>;

public class RejectSpeciesImageCommandHandler
    : IRequestHandler<RejectSpeciesImageCommand, SpeciesImageDTO>
{
    private readonly ISpeciesImageRepository _imageRepo;
    private readonly IScientificUnitOfWork _uow;

    public RejectSpeciesImageCommandHandler(
        ISpeciesImageRepository imageRepo,
        IScientificUnitOfWork uow)
    {
        _imageRepo = imageRepo;
        _uow = uow;
    }

    public async Task<SpeciesImageDTO> Handle(RejectSpeciesImageCommand request, CancellationToken ct)
    {
        var image = await _imageRepo.GetByIdAsync(request.ImageId, ct)
            ?? throw new NotFoundException(nameof(SpeciesImage), request.ImageId);

        image.Reject();
        await _uow.SaveChangesAsync(ct);

        return new SpeciesImageDTO(
            image.Id, image.SpeciesId, image.ImageUrl, image.ThumbnailUrl,
            image.IsPrimary, image.IsValidatedByExpert, image.LicenseType, image.CreatedAt);
    }
}
