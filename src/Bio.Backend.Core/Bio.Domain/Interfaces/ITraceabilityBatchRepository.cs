using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repository for TraceabilityBatch — origin tracking records for marketplace products.
/// </summary>
public interface ITraceabilityBatchRepository
{
    Task<TraceabilityBatch?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<TraceabilityBatch>> GetByProductIdAsync(Guid productId, CancellationToken ct = default);
    Task<bool> ExistsByBatchCodeAsync(string batchCode, CancellationToken ct = default);
    Task AddAsync(TraceabilityBatch batch, CancellationToken ct = default);
    Task DeleteAsync(TraceabilityBatch batch, CancellationToken ct = default);
}
