using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.ProductCategories.Commands;

public record CreateProductCategoryCommand(ProductCategoryCreateDTO Dto) : IRequest<ProductCategoryResponseDTO>;

public class CreateProductCategoryCommandHandler : IRequestHandler<CreateProductCategoryCommand, ProductCategoryResponseDTO>
{
    private readonly IProductCategoryRepository _repo;
    private readonly IUnitOfWork _uow;

    public CreateProductCategoryCommandHandler(IProductCategoryRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<ProductCategoryResponseDTO> Handle(CreateProductCategoryCommand request, CancellationToken ct)
    {
        if (await _repo.ExistsByNameAsync(request.Dto.Name, ct))
            throw new ConflictException($"Category '{request.Dto.Name}' already exists.");
        var category = new ProductCategory(request.Dto.Name);
        await _repo.AddAsync(category, ct);
        await _uow.SaveChangesAsync(ct);
        return new ProductCategoryResponseDTO(category.Id, category.Name);
    }
}

public record UpdateProductCategoryCommand(int Id, ProductCategoryUpdateDTO Dto) : IRequest<ProductCategoryResponseDTO>;

public class UpdateProductCategoryCommandHandler : IRequestHandler<UpdateProductCategoryCommand, ProductCategoryResponseDTO>
{
    private readonly IProductCategoryRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpdateProductCategoryCommandHandler(IProductCategoryRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<ProductCategoryResponseDTO> Handle(UpdateProductCategoryCommand request, CancellationToken ct)
    {
        var category = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(ProductCategory), request.Id);
        if (await _repo.ExistsByNameExcludingIdAsync(request.Dto.Name, request.Id, ct))
            throw new ConflictException($"Category '{request.Dto.Name}' already exists.");
        category.Update(request.Dto.Name);
        await _uow.SaveChangesAsync(ct);
        return new ProductCategoryResponseDTO(category.Id, category.Name);
    }
}

public record DeleteProductCategoryCommand(int Id) : IRequest<Unit>;

public class DeleteProductCategoryCommandHandler : IRequestHandler<DeleteProductCategoryCommand, Unit>
{
    private readonly IProductCategoryRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeleteProductCategoryCommandHandler(IProductCategoryRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(DeleteProductCategoryCommand request, CancellationToken ct)
    {
        var category = await _repo.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(ProductCategory), request.Id);
        await _repo.DeleteAsync(category, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
