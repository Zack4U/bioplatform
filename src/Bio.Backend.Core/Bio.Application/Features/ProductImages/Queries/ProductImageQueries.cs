using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.ProductImages.Queries;

public record GetProductImagesQuery(Guid ProductId) : IRequest<IReadOnlyList<ProductImageResponseDTO>>;

public class GetProductImagesQueryHandler : IRequestHandler<GetProductImagesQuery, IReadOnlyList<ProductImageResponseDTO>>
{
    private readonly IProductImageRepository _repo;
    public GetProductImagesQueryHandler(IProductImageRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<ProductImageResponseDTO>> Handle(GetProductImagesQuery request, CancellationToken ct)
    {
        var images = await _repo.GetByProductIdAsync(request.ProductId, ct);
        return images.Select(i => new ProductImageResponseDTO(i.Id, i.ImageUrl, i.AltText, i.DisplayOrder, i.IsPrimary)).ToList();
    }
}
