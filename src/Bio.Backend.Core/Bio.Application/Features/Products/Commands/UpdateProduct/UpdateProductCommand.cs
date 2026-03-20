using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;
using AutoMapper;

namespace Bio.Application.Features.Products.Commands.UpdateProduct;

public record UpdateProductCommand(Guid Id, ProductUpdateDTO Dto) : IRequest<ProductResponseDTO>;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, ProductResponseDTO>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UpdateProductCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ProductResponseDTO> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(request.Id, cancellationToken);
        if (product == null)
            throw new NotFoundException(nameof(Product), request.Id);

        var dto = request.Dto;

        // Check if category exists if provided
        if (dto.CategoryId.HasValue)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(dto.CategoryId.Value, cancellationToken);
            if (category == null)
                throw new NotFoundException(nameof(ProductCategory), dto.CategoryId.Value);
        }

        product.Update(
            dto.Name,
            dto.Description,
            dto.Price,
            dto.StockQuantity,
            dto.Sku,
            dto.ThumbnailUrl,
            dto.CategoryId);

        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ProductResponseDTO>(product);
    }
}
