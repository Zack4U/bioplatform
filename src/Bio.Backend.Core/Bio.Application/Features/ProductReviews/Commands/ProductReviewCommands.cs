using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.ProductReviews.Commands;

public record CreateProductReviewCommand(Guid ProductId, ProductReviewCreateDTO Dto, Guid UserId) : IRequest<ProductReviewResponseDTO>;

public class CreateProductReviewCommandHandler : IRequestHandler<CreateProductReviewCommand, ProductReviewResponseDTO>
{
    private readonly IProductReviewRepository _repo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public CreateProductReviewCommandHandler(IProductReviewRepository repo, IProductRepository productRepo, IUnitOfWork uow)
    { _repo = repo; _productRepo = productRepo; _uow = uow; }

    public async Task<ProductReviewResponseDTO> Handle(CreateProductReviewCommand request, CancellationToken ct)
    {
        _ = await _productRepo.GetByIdAsync(request.ProductId, ct)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        if (await _repo.ExistsByUserAndProductAsync(request.UserId, request.ProductId, ct))
            throw new ConflictException("You have already reviewed this product.");

        var review = new ProductReview(request.ProductId, request.UserId, request.Dto.Rating, request.Dto.Title, request.Dto.Comment);
        await _repo.AddAsync(review, ct);
        await _uow.SaveChangesAsync(ct);
        return new ProductReviewResponseDTO(review.Id, review.UserId, review.Rating, review.Title, review.Comment, review.CreatedAt);
    }
}

public record UpdateProductReviewCommand(Guid ReviewId, ProductReviewUpdateDTO Dto, Guid UserId) : IRequest<ProductReviewResponseDTO>;

public class UpdateProductReviewCommandHandler : IRequestHandler<UpdateProductReviewCommand, ProductReviewResponseDTO>
{
    private readonly IProductReviewRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpdateProductReviewCommandHandler(IProductReviewRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<ProductReviewResponseDTO> Handle(UpdateProductReviewCommand request, CancellationToken ct)
    {
        var review = await _repo.GetByIdAsync(request.ReviewId, ct)
            ?? throw new NotFoundException(nameof(ProductReview), request.ReviewId);
        if (review.UserId != request.UserId)
            throw new ForbiddenException("You can only edit your own reviews.");

        review.Update(request.Dto.Rating, request.Dto.Title, request.Dto.Comment);
        await _uow.SaveChangesAsync(ct);
        return new ProductReviewResponseDTO(review.Id, review.UserId, review.Rating, review.Title, review.Comment, review.CreatedAt);
    }
}

public record DeleteProductReviewCommand(Guid ReviewId, Guid UserId, string UserRole) : IRequest<Unit>;

public class DeleteProductReviewCommandHandler : IRequestHandler<DeleteProductReviewCommand, Unit>
{
    private readonly IProductReviewRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeleteProductReviewCommandHandler(IProductReviewRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(DeleteProductReviewCommand request, CancellationToken ct)
    {
        var review = await _repo.GetByIdAsync(request.ReviewId, ct)
            ?? throw new NotFoundException(nameof(ProductReview), request.ReviewId);
        if (request.UserRole != "ADMIN" && review.UserId != request.UserId)
            throw new ForbiddenException("You can only delete your own reviews.");

        await _repo.DeleteAsync(review, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
