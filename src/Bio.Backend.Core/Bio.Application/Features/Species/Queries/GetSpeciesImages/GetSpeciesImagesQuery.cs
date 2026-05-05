using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Species.Queries.GetSpeciesImages;

/// <summary>
/// Obtiene las imágenes de una especie con paginación y filtro de validación por experto.
/// Retorna PaginatedResult con DTO ligero para la galería del frontend.
/// </summary>
public record GetSpeciesImagesQuery(
    Guid SpeciesId,
    bool OnlyValidatedByExpert = true,
    int Page = 1,
    int PageSize = 20
) : IRequest<PaginatedResult<SpeciesImageDTO>>;

public class GetSpeciesImagesQueryHandler
    : IRequestHandler<GetSpeciesImagesQuery, PaginatedResult<SpeciesImageDTO>>
{
    private readonly ISpeciesRepository _speciesRepository;
    private readonly ISpeciesImageRepository _imageRepository;

    public GetSpeciesImagesQueryHandler(
        ISpeciesRepository speciesRepository,
        ISpeciesImageRepository imageRepository)
    {
        _speciesRepository = speciesRepository;
        _imageRepository = imageRepository;
    }

    public async Task<PaginatedResult<SpeciesImageDTO>> Handle(
        GetSpeciesImagesQuery request,
        CancellationToken cancellationToken)
    {
        // Verify species exists
        _ = await _speciesRepository.GetByIdAsync(request.SpeciesId, cancellationToken)
            ?? throw new Bio.Domain.Exceptions.NotFoundException(
                $"Species with id {request.SpeciesId} not found.");

        var (items, totalCount) = await _imageRepository.GetBySpeciesIdAsync(
            request.SpeciesId,
            request.OnlyValidatedByExpert,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = items.Select(img => new SpeciesImageDTO(
            img.Id,
            img.SpeciesId,
            img.ImageUrl,
            img.ThumbnailUrl,
            img.IsPrimary,
            img.IsValidatedByExpert,
            img.LicenseType,
            img.CreatedAt
        )).ToList();

        return PaginatedResult<SpeciesImageDTO>.Create(
            dtos,
            totalCount,
            request.Page,
            request.PageSize);
    }
}
