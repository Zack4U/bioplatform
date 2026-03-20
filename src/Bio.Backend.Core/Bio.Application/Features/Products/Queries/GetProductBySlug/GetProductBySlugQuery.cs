using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;
using AutoMapper;

namespace Bio.Application.Features.Products.Queries.GetProductBySlug;

public record GetProductBySlugQuery(string Slug) : IRequest<ProductResponseDTO>;

public class GetProductBySlugQueryHandler : IRequestHandler<GetProductBySlugQuery, ProductResponseDTO>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetProductBySlugQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ProductResponseDTO> Handle(GetProductBySlugQuery request, CancellationToken cancellationToken)
    {
        var product = await _unitOfWork.Products.GetBySlugAsync(request.Slug, cancellationToken);
        if (product == null)
            throw new NotFoundException(nameof(Product), request.Slug);

        return _mapper.Map<ProductResponseDTO>(product);
    }
}
