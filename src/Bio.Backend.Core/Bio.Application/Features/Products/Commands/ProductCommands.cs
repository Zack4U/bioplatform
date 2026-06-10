using Bio.Application.DTOs;
using Bio.Application.Features.Products.Queries;
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
    private readonly ICacheService _cache;

    public CreateProductCommandHandler(IProductRepository repo, IAbsPermitRepository absRepo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _absRepo = absRepo; _uow = uow; _cache = cache; }

    public async Task<ProductDetailDTO> Handle(CreateProductCommand request, CancellationToken ct)
    {
        var dto = request.Dto;

        // Auto-generate slug from name if not provided by the client
        var slug = string.IsNullOrWhiteSpace(dto.Slug)
            ? GenerateSlug(dto.Name)
            : dto.Slug;

        // ABS compliance: validate active permit exists for this entrepreneur + species
        var permit = await _absRepo.GetActiveByEntrepreneurAndSpeciesAsync(request.EntrepreneurId, dto.BaseSpeciesId, ct);
        if (permit == null || !permit.IsActiveAndValid())
            throw new ForbiddenException("No active ABS permit found for this species. Product creation requires a valid permit under Nagoya Protocol / Decision 391.");

        var product = new Product(
            request.EntrepreneurId, dto.BaseSpeciesId, dto.Name, slug,
            dto.Description, dto.BasePrice, dto.SellPrice, dto.StockQuantity,
            dto.CategoryId, dto.Sku, dto.Composition, dto.ThumbnailUrl);

        await _repo.AddAsync(product, ct);
        await _uow.SaveChangesAsync(ct);

        // Invalidate public list + filter-meta so admin/managed views and counts reflect the new product.
        await Task.WhenAll(
            _cache.RemoveByPrefixAsync(CacheKeys.PublicProductsPrefix, ct),
            _cache.RemoveAsync(CacheKeys.FilterMeta, ct));

        var created = await _repo.GetByIdWithDetailsAsync(product.Id, ct);
        return MapToDetail(created!);
    }

    /// <summary>Converts a name to a URL-safe slug (lowercase, hyphens, ASCII only).</summary>
    private static string GenerateSlug(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return Guid.NewGuid().ToString("N")[..12];
        var normalized = name.ToLowerInvariant()
            .Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder();
        foreach (var ch in normalized)
        {
            var cat = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch);
            if (cat == System.Globalization.UnicodeCategory.NonSpacingMark) continue;
            sb.Append(char.IsLetterOrDigit(ch) || ch == '-' ? ch : ' ');
        }
        return System.Text.RegularExpressions.Regex.Replace(sb.ToString().Trim(), @"\s+", "-")
               .Trim('-')[..Math.Min(120, sb.Length)];
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
    private readonly ICacheService _cache;

    public UpdateProductCommandHandler(IProductRepository repo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _uow = uow; _cache = cache; }

    public async Task<ProductDetailDTO> Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdWithDetailsAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Product), request.Id);

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

        // Invalidate product caches
        await Task.WhenAll(
            _cache.RemoveAsync(CacheKeys.ProductById(product.Id), ct),
            _cache.RemoveAsync(CacheKeys.ProductBySlug(product.Slug), ct),
            _cache.RemoveByPrefixAsync(CacheKeys.PublicProductsPrefix, ct));

        return CreateProductCommandHandler.MapToDetail(product);
    }
}

// === Delete Product ===
public record DeleteProductCommand(Guid Id, Guid ActorId, string ActorRole) : IRequest<Unit>;

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, Unit>
{
    private readonly IProductRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public DeleteProductCommandHandler(IProductRepository repo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _uow = uow; _cache = cache; }

    public async Task<Unit> Handle(DeleteProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Product), request.Id);

        if (request.ActorRole != "ADMIN" && product.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only delete your own products.");

        product.SoftDelete(); // Soft delete: hidden from all listings, retained for audit
        await _uow.SaveChangesAsync(ct);

        await Task.WhenAll(
            _cache.RemoveAsync(CacheKeys.ProductById(product.Id), ct),
            _cache.RemoveAsync(CacheKeys.ProductBySlug(product.Slug), ct),
            _cache.RemoveByPrefixAsync(CacheKeys.PublicProductsPrefix, ct),
            _cache.RemoveAsync(CacheKeys.FilterMeta, ct));

        return Unit.Value;
    }
}

// === Helper: roles allowed to moderate any product regardless of ownership ===
internal static class ProductRoles
{
    internal static bool IsModerator(string role) =>
        role == "ADMIN" || role == "AUTHORITY";
}

// === Activate Product ===
// Moderators (Admin/Authority) may always toggle. An entrepreneur may toggle ONLY their own
// product and ONLY once it has been approved.
public record ActivateProductCommand(Guid Id, Guid ActorId, string ActorRole) : IRequest<Unit>;

public class ActivateProductCommandHandler : IRequestHandler<ActivateProductCommand, Unit>
{
    private readonly IProductRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public ActivateProductCommandHandler(IProductRepository repo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _uow = uow; _cache = cache; }

    public async Task<Unit> Handle(ActivateProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Product), request.Id);

        if (!ProductRoles.IsModerator(request.ActorRole))
        {
            if (product.EntrepreneurId != request.ActorId)
                throw new ForbiddenException("You can only manage your own products.");
            if (!product.IsApproved)
                throw new ForbiddenException("This product has not been validated yet. Wait for approval before activating it.");
        }

        product.Activate();
        await _uow.SaveChangesAsync(ct);
        await Task.WhenAll(
            _cache.RemoveAsync(CacheKeys.ProductById(product.Id), ct),
            _cache.RemoveAsync(CacheKeys.ProductBySlug(product.Slug), ct),
            _cache.RemoveByPrefixAsync(CacheKeys.PublicProductsPrefix, ct));
        return Unit.Value;
    }
}

// === Deactivate Product ===
public record DeactivateProductCommand(Guid Id, Guid ActorId, string ActorRole) : IRequest<Unit>;

public class DeactivateProductCommandHandler : IRequestHandler<DeactivateProductCommand, Unit>
{
    private readonly IProductRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public DeactivateProductCommandHandler(IProductRepository repo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _uow = uow; _cache = cache; }

    public async Task<Unit> Handle(DeactivateProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Product), request.Id);

        if (!ProductRoles.IsModerator(request.ActorRole))
        {
            if (product.EntrepreneurId != request.ActorId)
                throw new ForbiddenException("You can only manage your own products.");
            if (!product.IsApproved)
                throw new ForbiddenException("This product has not been validated yet.");
        }

        product.Deactivate();
        await _uow.SaveChangesAsync(ct);
        await Task.WhenAll(
            _cache.RemoveAsync(CacheKeys.ProductById(product.Id), ct),
            _cache.RemoveAsync(CacheKeys.ProductBySlug(product.Slug), ct),
            _cache.RemoveByPrefixAsync(CacheKeys.PublicProductsPrefix, ct));
        return Unit.Value;
    }
}

// === Approve Product (Admin / Authority) ===
public record ApproveProductCommand(Guid Id, Guid ApproverId) : IRequest<Unit>;

public class ApproveProductCommandHandler : IRequestHandler<ApproveProductCommand, Unit>
{
    private readonly IProductRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public ApproveProductCommandHandler(IProductRepository repo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _uow = uow; _cache = cache; }

    public async Task<Unit> Handle(ApproveProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Product), request.Id);
        product.Approve(request.ApproverId);
        await _uow.SaveChangesAsync(ct);
        await Task.WhenAll(
            _cache.RemoveAsync(CacheKeys.ProductById(product.Id), ct),
            _cache.RemoveAsync(CacheKeys.ProductBySlug(product.Slug), ct),
            _cache.RemoveByPrefixAsync(CacheKeys.PublicProductsPrefix, ct),
            _cache.RemoveAsync(CacheKeys.FilterMeta, ct));
        return Unit.Value;
    }
}

// === Reject Product (Admin / Authority) ===
public record RejectProductCommand(Guid Id, Guid ApproverId, string Reason) : IRequest<Unit>;

public class RejectProductCommandHandler : IRequestHandler<RejectProductCommand, Unit>
{
    private readonly IProductRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public RejectProductCommandHandler(IProductRepository repo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _uow = uow; _cache = cache; }

    public async Task<Unit> Handle(RejectProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Product), request.Id);
        product.Reject(request.ApproverId, request.Reason);
        await _uow.SaveChangesAsync(ct);
        await Task.WhenAll(
            _cache.RemoveAsync(CacheKeys.ProductById(product.Id), ct),
            _cache.RemoveAsync(CacheKeys.ProductBySlug(product.Slug), ct),
            _cache.RemoveByPrefixAsync(CacheKeys.PublicProductsPrefix, ct));
        return Unit.Value;
    }
}
