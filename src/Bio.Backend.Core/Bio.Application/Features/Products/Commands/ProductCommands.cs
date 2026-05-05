using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Products.Commands;

// === Create Product ===
public record CreateProductCommand(ProductCreateDTO Dto, Guid EntrepreneurId) : IRequest<ProductDetailDTO>;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ProductDetailDTO>
{
    private readonly IProductRepository _repo;
    private readonly IAbsPermitRepository _absRepo;
    private readonly IUnitOfWork _uow;

    public CreateProductCommandHandler(IProductRepository repo, IAbsPermitRepository absRepo, IUnitOfWork uow)
    { _repo = repo; _absRepo = absRepo; _uow = uow; }

    public async Task<ProductDetailDTO> Handle(CreateProductCommand request, CancellationToken ct)
    {
        var dto = request.Dto;

        // ABS compliance: validate active permit exists for this entrepreneur + species
        var permit = await _absRepo.GetActiveByEntrepreneurAndSpeciesAsync(request.EntrepreneurId, dto.BaseSpeciesId, ct);
        if (permit == null || !permit.IsActiveAndValid())
            throw new ForbiddenException("No active ABS permit found for this species. Product creation requires a valid permit under Nagoya Protocol / Decision 391.");

        var product = new Product(
            request.EntrepreneurId, dto.BaseSpeciesId, dto.Name, dto.Slug,
            dto.Description, dto.BasePrice, dto.SellPrice, dto.StockQuantity,
            dto.CategoryId, dto.Sku, dto.Composition, dto.ThumbnailUrl);

        await _repo.AddAsync(product, ct);
        await _uow.SaveChangesAsync(ct);

        var created = await _repo.GetByIdWithDetailsAsync(product.Id, ct);
        return MapToDetail(created!);
    }

    internal static ProductDetailDTO MapToDetail(Product p) => new(
        p.Id, p.Slug, p.Name, p.Description,
        p.BasePrice, p.SellPrice, p.StockQuantity, p.IsActive,
        p.Sku, p.Composition, p.ThumbnailUrl,
        p.BaseSpeciesId, p.EntrepreneurId,
        p.Category?.Name, p.CategoryId,
        p.Reviews.Count > 0 ? p.Reviews.Average(r => r.Rating) : 0,
        p.Reviews.Count,
        p.Images.Select(i => new ProductImageResponseDTO(i.Id, i.ImageUrl, i.AltText, i.DisplayOrder, i.IsPrimary)).ToList(),
        p.Certifications.Select(c => new CertificationResponseDTO(
            c.Id, c.ProductId, c.Name, c.CertificationType, c.IssuingBody, c.CertificateNumber,
            c.IssuedAt, c.ExpiresAt, c.Status, c.DocumentUrl, c.LogoUrl, c.VerificationCode, c.CreatedAt, c.UpdatedAt)).ToList(),
        p.CreatedAt, p.UpdatedAt);
}

// === Update Product ===
public record UpdateProductCommand(Guid Id, ProductUpdateDTO Dto, Guid ActorId, string ActorRole) : IRequest<ProductDetailDTO>;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, ProductDetailDTO>
{
    private readonly IProductRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpdateProductCommandHandler(IProductRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<ProductDetailDTO> Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdWithDetailsAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Product), request.Id);

        // RBAC: Entrepreneur can only update own products
        if (request.ActorRole != "ADMIN" && product.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only update your own products.");

        if (request.Dto.Slug != null)
        {
            var slugExists = await _repo.ExistsBySlugExcludingIdAsync(request.Dto.Slug, request.Id, ct);
            if (slugExists) throw new ConflictException($"Slug '{request.Dto.Slug}' is already in use.");
        }

        product.Update(request.Dto.Name, request.Dto.Slug, request.Dto.Description,
            request.Dto.BasePrice, request.Dto.SellPrice, request.Dto.StockQuantity,
            request.Dto.CategoryId, request.Dto.Sku, request.Dto.Composition, request.Dto.ThumbnailUrl);

        await _uow.SaveChangesAsync(ct);
        return CreateProductCommandHandler.MapToDetail(product);
    }
}

// === Delete Product ===
public record DeleteProductCommand(Guid Id, Guid ActorId, string ActorRole) : IRequest<Unit>;

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, Unit>
{
    private readonly IProductRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeleteProductCommandHandler(IProductRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(DeleteProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Product), request.Id);

        if (request.ActorRole != "ADMIN" && product.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only delete your own products.");

        product.Deactivate(); // Soft delete via deactivation
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// === Activate Product ===
public record ActivateProductCommand(Guid Id) : IRequest<Unit>;

public class ActivateProductCommandHandler : IRequestHandler<ActivateProductCommand, Unit>
{
    private readonly IProductRepository _repo;
    private readonly IUnitOfWork _uow;

    public ActivateProductCommandHandler(IProductRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(ActivateProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Product), request.Id);
        product.Activate();
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// === Deactivate Product ===
public record DeactivateProductCommand(Guid Id) : IRequest<Unit>;

public class DeactivateProductCommandHandler : IRequestHandler<DeactivateProductCommand, Unit>
{
    private readonly IProductRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeactivateProductCommandHandler(IProductRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(DeactivateProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Product), request.Id);
        product.Deactivate();
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
