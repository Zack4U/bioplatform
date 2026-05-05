using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.ProductImages.Commands;

public record AddProductImageCommand(Guid ProductId, ProductImageCreateDTO Dto, Guid ActorId, string ActorRole) : IRequest<ProductImageResponseDTO>;

public class AddProductImageCommandHandler : IRequestHandler<AddProductImageCommand, ProductImageResponseDTO>
{
    private readonly IProductRepository _productRepo;
    private readonly IProductImageRepository _imageRepo;
    private readonly IUnitOfWork _uow;

    public AddProductImageCommandHandler(IProductRepository productRepo, IProductImageRepository imageRepo, IUnitOfWork uow)
    { _productRepo = productRepo; _imageRepo = imageRepo; _uow = uow; }

    public async Task<ProductImageResponseDTO> Handle(AddProductImageCommand request, CancellationToken ct)
    {
        var product = await _productRepo.GetByIdAsync(request.ProductId, ct)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);
        if (request.ActorRole != "ADMIN" && product.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only manage images for your own products.");

        if (request.Dto.IsPrimary)
            await _imageRepo.ClearPrimaryForProductAsync(request.ProductId, ct);

        var image = new ProductImage(request.ProductId, request.Dto.ImageUrl, request.Dto.AltText, request.Dto.DisplayOrder, request.Dto.IsPrimary);
        await _imageRepo.AddAsync(image, ct);
        await _uow.SaveChangesAsync(ct);
        return new ProductImageResponseDTO(image.Id, image.ImageUrl, image.AltText, image.DisplayOrder, image.IsPrimary);
    }
}

public record DeleteProductImageCommand(Guid ImageId, Guid ActorId, string ActorRole) : IRequest<Unit>;

public class DeleteProductImageCommandHandler : IRequestHandler<DeleteProductImageCommand, Unit>
{
    private readonly IProductRepository _productRepo;
    private readonly IProductImageRepository _imageRepo;
    private readonly IUnitOfWork _uow;

    public DeleteProductImageCommandHandler(IProductRepository productRepo, IProductImageRepository imageRepo, IUnitOfWork uow)
    { _productRepo = productRepo; _imageRepo = imageRepo; _uow = uow; }

    public async Task<Unit> Handle(DeleteProductImageCommand request, CancellationToken ct)
    {
        var image = await _imageRepo.GetByIdAsync(request.ImageId, ct)
            ?? throw new NotFoundException(nameof(ProductImage), request.ImageId);
        var product = await _productRepo.GetByIdAsync(image.ProductId, ct)!;
        if (request.ActorRole != "ADMIN" && product!.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only manage images for your own products.");

        await _imageRepo.DeleteAsync(image, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public record SetPrimaryProductImageCommand(Guid ImageId, Guid ActorId, string ActorRole) : IRequest<Unit>;

public class SetPrimaryProductImageCommandHandler : IRequestHandler<SetPrimaryProductImageCommand, Unit>
{
    private readonly IProductRepository _productRepo;
    private readonly IProductImageRepository _imageRepo;
    private readonly IUnitOfWork _uow;

    public SetPrimaryProductImageCommandHandler(IProductRepository productRepo, IProductImageRepository imageRepo, IUnitOfWork uow)
    { _productRepo = productRepo; _imageRepo = imageRepo; _uow = uow; }

    public async Task<Unit> Handle(SetPrimaryProductImageCommand request, CancellationToken ct)
    {
        var image = await _imageRepo.GetByIdAsync(request.ImageId, ct)
            ?? throw new NotFoundException(nameof(ProductImage), request.ImageId);
        var product = await _productRepo.GetByIdAsync(image.ProductId, ct)!;
        if (request.ActorRole != "ADMIN" && product!.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only manage images for your own products.");

        await _imageRepo.ClearPrimaryForProductAsync(image.ProductId, ct);
        image.SetPrimary(true);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
