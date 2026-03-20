using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;
using AutoMapper;

namespace Bio.Application.Features.Products.Commands.CreateProduct;

public record CreateProductCommand(ProductCreateDTO Dto) : IRequest<ProductResponseDTO>;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ProductResponseDTO>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateProductCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ProductResponseDTO> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        // Check if slug already exists
        var existingProduct = await _unitOfWork.Products.GetBySlugAsync(dto.Slug, cancellationToken);
        if (existingProduct != null)
            throw new ConflictException($"Product with slug '{dto.Slug}' already exists.");

        // Check if category exists if provided
        if (dto.CategoryId.HasValue)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(dto.CategoryId.Value, cancellationToken);
            if (category == null)
                throw new NotFoundException(nameof(ProductCategory), dto.CategoryId.Value);
        }

        var product = new Product(
            Guid.NewGuid(),
            dto.EntrepreneurId,
            dto.BaseSpeciesId,
            dto.CategoryId,
            dto.Slug,
            dto.Name,
            dto.Description,
            dto.Price,
            dto.StockQuantity,
            dto.Sku,
            dto.ThumbnailUrl);

        await _unitOfWork.Products.AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ProductResponseDTO>(product);
    }
}
