using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Species.Queries.ExportSpeciesImages;

/// <summary>
/// Exportación paginada de TODAS las imágenes del catálogo (de todas las especies)
/// para descarga offline por lotes. Cada item incluye su SpeciesId.
/// </summary>
public record ExportSpeciesImagesQuery(
    bool OnlyValidatedByExpert = false,
    int Page = 1,
    int PageSize = 50
) : IRequest<PaginatedResult<SpeciesImageDTO>>;

public class ExportSpeciesImagesQueryHandler
    : IRequestHandler<ExportSpeciesImagesQuery, PaginatedResult<SpeciesImageDTO>>
{
    private readonly ISpeciesImageRepository _imageRepository;

    public ExportSpeciesImagesQueryHandler(ISpeciesImageRepository imageRepository)
    {
        _imageRepository = imageRepository;
    }

    public async Task<PaginatedResult<SpeciesImageDTO>> Handle(
        ExportSpeciesImagesQuery request,
        CancellationToken cancellationToken)
    {
        var (items, totalCount) = await _imageRepository.GetAllPagedAsync(
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
