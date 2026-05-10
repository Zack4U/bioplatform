using Bio.Application.DTOs;
using Bio.Application.Features.Traceability.Commands;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Traceability.Queries;

public record GetBatchesByProductQuery(Guid ProductId) : IRequest<IReadOnlyList<TraceabilityBatchResponseDTO>>;

public class GetBatchesByProductQueryHandler
    : IRequestHandler<GetBatchesByProductQuery, IReadOnlyList<TraceabilityBatchResponseDTO>>
{
    private readonly ITraceabilityBatchRepository _repo;
    private readonly IProductRepository _productRepo;

    public GetBatchesByProductQueryHandler(ITraceabilityBatchRepository repo, IProductRepository productRepo)
    { _repo = repo; _productRepo = productRepo; }

    public async Task<IReadOnlyList<TraceabilityBatchResponseDTO>> Handle(
        GetBatchesByProductQuery request, CancellationToken ct)
    {
        _ = await _productRepo.GetByIdAsync(request.ProductId, ct)
            ?? throw new NotFoundException("Product", request.ProductId);

        var batches = await _repo.GetByProductIdAsync(request.ProductId, ct);
        return batches.Select(TraceabilityMapper.Map).ToList();
    }
}

public record GetBatchByIdQuery(Guid BatchId) : IRequest<TraceabilityBatchResponseDTO>;

public class GetBatchByIdQueryHandler
    : IRequestHandler<GetBatchByIdQuery, TraceabilityBatchResponseDTO>
{
    private readonly ITraceabilityBatchRepository _repo;

    public GetBatchByIdQueryHandler(ITraceabilityBatchRepository repo) => _repo = repo;

    public async Task<TraceabilityBatchResponseDTO> Handle(GetBatchByIdQuery request, CancellationToken ct)
    {
        var batch = await _repo.GetByIdAsync(request.BatchId, ct)
            ?? throw new NotFoundException("TraceabilityBatch", request.BatchId);
        return TraceabilityMapper.Map(batch);
    }
}
