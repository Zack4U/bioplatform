using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.ProductCategories.Queries;

public record GetAllProductCategoriesQuery : IRequest<IReadOnlyList<ProductCategoryResponseDTO>>;

public class GetAllProductCategoriesQueryHandler : IRequestHandler<GetAllProductCategoriesQuery, IReadOnlyList<ProductCategoryResponseDTO>>
{
    private readonly IProductCategoryRepository _repo;
    public GetAllProductCategoriesQueryHandler(IProductCategoryRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<ProductCategoryResponseDTO>> Handle(GetAllProductCategoriesQuery request, CancellationToken ct)
    {
        var items = await _repo.GetAllAsync(ct);
        return items.Select(c => new ProductCategoryResponseDTO(c.Id, c.Name)).ToList();
    }
}
