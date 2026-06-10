using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Traceability.Commands;

internal static class TraceabilityMapper
{
    internal static TraceabilityBatchResponseDTO Map(TraceabilityBatch b) => new(
        b.Id, b.ProductId, b.BatchCode, b.HarvestDate,
        b.OriginLocation, b.ProcessingDetails, b.BlockchainHash);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE BATCH
// ═══════════════════════════════════════════════════════════════════════════════
public record CreateTraceabilityBatchCommand(
    Guid ProductId,
    TraceabilityBatchCreateDTO Dto,
    Guid ActorId,
    string ActorRole) : IRequest<TraceabilityBatchResponseDTO>;

public class CreateTraceabilityBatchCommandHandler
    : IRequestHandler<CreateTraceabilityBatchCommand, TraceabilityBatchResponseDTO>
{
    private readonly ITraceabilityBatchRepository _repo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public CreateTraceabilityBatchCommandHandler(
        ITraceabilityBatchRepository repo, IProductRepository productRepo, IUnitOfWork uow)
    { _repo = repo; _productRepo = productRepo; _uow = uow; }

    public async Task<TraceabilityBatchResponseDTO> Handle(
        CreateTraceabilityBatchCommand request, CancellationToken ct)
    {
        var product = await _productRepo.GetByIdAsync(request.ProductId, ct)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        if (request.ActorRole != "ADMIN" && product.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only add traceability batches to your own products.");

        if (await _repo.ExistsByBatchCodeAsync(request.Dto.BatchCode, ct))
            throw new ConflictException($"Batch code '{request.Dto.BatchCode}' is already in use.");

        var batch = new TraceabilityBatch(
            request.ProductId, request.Dto.BatchCode, request.Dto.HarvestDate,
            request.Dto.OriginLocation, request.Dto.ProcessingDetails, request.Dto.BlockchainHash);

        await _repo.AddAsync(batch, ct);
        await _uow.SaveChangesAsync(ct);
        return TraceabilityMapper.Map(batch);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE BATCH
// ═══════════════════════════════════════════════════════════════════════════════
public record UpdateTraceabilityBatchCommand(
    Guid BatchId,
    TraceabilityBatchUpdateDTO Dto,
    Guid ActorId,
    string ActorRole) : IRequest<TraceabilityBatchResponseDTO>;

public class UpdateTraceabilityBatchCommandHandler
    : IRequestHandler<UpdateTraceabilityBatchCommand, TraceabilityBatchResponseDTO>
{
    private readonly ITraceabilityBatchRepository _repo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public UpdateTraceabilityBatchCommandHandler(
        ITraceabilityBatchRepository repo, IProductRepository productRepo, IUnitOfWork uow)
    { _repo = repo; _productRepo = productRepo; _uow = uow; }

    public async Task<TraceabilityBatchResponseDTO> Handle(
        UpdateTraceabilityBatchCommand request, CancellationToken ct)
    {
        var batch = await _repo.GetByIdAsync(request.BatchId, ct)
            ?? throw new NotFoundException(nameof(TraceabilityBatch), request.BatchId);

        var product = await _productRepo.GetByIdAsync(batch.ProductId, ct)!;
        if (request.ActorRole != "ADMIN" && product!.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only update traceability batches for your own products.");

        batch.Update(request.Dto.HarvestDate, request.Dto.OriginLocation,
                     request.Dto.ProcessingDetails, request.Dto.BlockchainHash);
        await _uow.SaveChangesAsync(ct);
        return TraceabilityMapper.Map(batch);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE BATCH
// ═══════════════════════════════════════════════════════════════════════════════
public record DeleteTraceabilityBatchCommand(Guid BatchId, Guid ActorId, string ActorRole) : IRequest<Unit>;

public class DeleteTraceabilityBatchCommandHandler
    : IRequestHandler<DeleteTraceabilityBatchCommand, Unit>
{
    private readonly ITraceabilityBatchRepository _repo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public DeleteTraceabilityBatchCommandHandler(
        ITraceabilityBatchRepository repo, IProductRepository productRepo, IUnitOfWork uow)
    { _repo = repo; _productRepo = productRepo; _uow = uow; }

    public async Task<Unit> Handle(DeleteTraceabilityBatchCommand request, CancellationToken ct)
    {
        var batch = await _repo.GetByIdAsync(request.BatchId, ct)
            ?? throw new NotFoundException(nameof(TraceabilityBatch), request.BatchId);

        var product = await _productRepo.GetByIdAsync(batch.ProductId, ct)!;
        if (request.ActorRole != "ADMIN" && product!.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only delete traceability batches for your own products.");

        await _repo.DeleteAsync(batch, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
