using Bio.Application.DTOs;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.ProductImages.Commands;

/// <summary>
/// Command to upload a product image to S3 and persist the metadata record.
/// The Application layer receives a raw Stream to stay free of ASP.NET Core dependencies.
/// </summary>
public record AddProductImageCommand : IRequest<ProductImageResponseDTO>
{
    /// <summary>ID of the product to attach the image to.</summary>
    public Guid ProductId { get; init; }

    /// <summary>Raw image stream extracted from the uploaded file.</summary>
    public Stream FileStream { get; init; } = Stream.Null;

    /// <summary>Original file name (used only for extension detection).</summary>
    public string OriginalFileName { get; init; } = string.Empty;

    /// <summary>MIME content type of the uploaded file (e.g. image/jpeg).</summary>
    public string ContentType { get; init; } = string.Empty;

    /// <summary>ID of the authenticated user (entrepreneur) from the JWT token.</summary>
    public Guid ActorId { get; init; }

    /// <summary>Role of the authenticated user from the JWT token.</summary>
    public string ActorRole { get; init; } = string.Empty;

    /// <summary>Accessibility alt text for the image.</summary>
    public string? AltText { get; init; }

    /// <summary>Display order in the product gallery.</summary>
    public int DisplayOrder { get; init; } = 0;

    /// <summary>Whether this image is the primary product image.</summary>
    public bool IsPrimary { get; init; } = false;
}

public class AddProductImageCommandHandler : IRequestHandler<AddProductImageCommand, ProductImageResponseDTO>
{
    private readonly IProductRepository _productRepo;
    private readonly IProductImageRepository _imageRepo;
    private readonly IS3StorageService _s3;
    private readonly IUnitOfWork _uow;

    public AddProductImageCommandHandler(
        IProductRepository productRepo,
        IProductImageRepository imageRepo,
        IS3StorageService s3,
        IUnitOfWork uow)
    {
        _productRepo = productRepo;
        _imageRepo = imageRepo;
        _s3 = s3;
        _uow = uow;
    }

    public async Task<ProductImageResponseDTO> Handle(AddProductImageCommand request, CancellationToken ct)
    {
        // 1. Verify product exists and ownership
        var product = await _productRepo.GetByIdAsync(request.ProductId, ct)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);
        if (request.ActorRole != "ADMIN" && product.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only manage images for your own products.");

        // 2. Clear existing primary if this is being set as primary
        if (request.IsPrimary)
            await _imageRepo.ClearPrimaryForProductAsync(request.ProductId, ct);

        // 3. Generate timestamped filename
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
        var extension = GetFileExtension(request.ContentType);
        var fileName = $"product_{timestamp}{extension}";

        // 4. Build S3 object key: assets/images/products/{entrepreneur_id}/{filename}
        var objectKey = $"{ObservationConstants.S3ProductImagesBasePath}/{product.EntrepreneurId}/{fileName}";

        // 5. Upload to S3
        var publicUrl = await _s3.UploadImageAsync(
            request.FileStream,
            objectKey,
            request.ContentType,
            ct);

        // 6. Create entity and persist
        var image = new ProductImage(request.ProductId, publicUrl, request.AltText, request.DisplayOrder, request.IsPrimary);
        await _imageRepo.AddAsync(image, ct);
        await _uow.SaveChangesAsync(ct);

        return new ProductImageResponseDTO(image.Id, image.ImageUrl, image.AltText, image.DisplayOrder, image.IsPrimary);
    }

    /// <summary>
    /// Maps a MIME content type to the corresponding file extension.
    /// Falls back to ".jpg" for unknown types.
    /// </summary>
    private static string GetFileExtension(string contentType) => contentType switch
    {
        "image/jpeg" => ".jpg",
        "image/png" => ".png",
        "image/webp" => ".webp",
        _ => ".jpg",
    };
}

public record DeleteProductImageCommand(Guid ImageId, Guid ActorId, string ActorRole) : IRequest<Unit>;

public class DeleteProductImageCommandHandler : IRequestHandler<DeleteProductImageCommand, Unit>
{
    private readonly IProductRepository _productRepo;
    private readonly IProductImageRepository _imageRepo;
    private readonly IS3StorageService _s3;
    private readonly IUnitOfWork _uow;

    public DeleteProductImageCommandHandler(
        IProductRepository productRepo,
        IProductImageRepository imageRepo,
        IS3StorageService s3,
        IUnitOfWork uow)
    {
        _productRepo = productRepo;
        _imageRepo = imageRepo;
        _s3 = s3;
        _uow = uow;
    }

    public async Task<Unit> Handle(DeleteProductImageCommand request, CancellationToken ct)
    {
        var image = await _imageRepo.GetByIdAsync(request.ImageId, ct)
            ?? throw new NotFoundException(nameof(ProductImage), request.ImageId);
        var product = await _productRepo.GetByIdAsync(image.ProductId, ct)!;
        if (request.ActorRole != "ADMIN" && product!.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only manage images for your own products.");

        // Delete from S3 first
        var objectKey = _s3.ExtractObjectKey(image.ImageUrl);
        await _s3.DeleteObjectAsync(objectKey, ct);

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
