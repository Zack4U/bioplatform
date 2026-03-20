using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;
using AutoMapper;

namespace Bio.Application.Features.Products.Queries.GetAllProducts;

public record GetAllProductsQuery(int Skip = 0, int Take = 10, bool OnlyActive = true) : IRequest<IEnumerable<ProductResponseDTO>>;

public class GetAllProductsQueryHandler : IRequestHandler<GetAllProductsQuery, IEnumerable<ProductResponseDTO>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllProductsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ProductResponseDTO>> Handle(GetAllProductsQuery request, CancellationToken cancellationToken)
    {
        var products = await _unitOfWork.Products.ListAsync(request.Skip, request.Take, request.OnlyActive, cancellationToken);
        return _mapper.Map<IEnumerable<ProductResponseDTO>>(products);
    }
}
