using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;
using AutoMapper;

namespace Bio.Application.Features.Products.ProductCategories.Queries.GetAllProductCategories;

public record GetAllProductCategoriesQuery() : IRequest<IEnumerable<ProductCategoryResponseDTO>>;

public class GetAllProductCategoriesQueryHandler : IRequestHandler<GetAllProductCategoriesQuery, IEnumerable<ProductCategoryResponseDTO>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllProductCategoriesQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ProductCategoryResponseDTO>> Handle(GetAllProductCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await _unitOfWork.Categories.ListAsync(cancellationToken);
        return _mapper.Map<IEnumerable<ProductCategoryResponseDTO>>(categories);
    }
}
