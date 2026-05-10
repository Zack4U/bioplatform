namespace Bio.Domain.Entities;

/// <summary>
/// Origin traceability batches for products. Fulfills traceability requirements.
/// Table: TraceabilityBatches (SQL Server).
/// </summary>
public class TraceabilityBatch
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string BatchCode { get; private set; } = string.Empty;
    public DateTime HarvestDate { get; private set; }
    public string OriginLocation { get; private set; } = string.Empty;
    public string? ProcessingDetails { get; private set; }
    public string? BlockchainHash { get; private set; }

    // Navigation property
    public Product Product { get; private set; } = null!;

    private TraceabilityBatch() { }

    public TraceabilityBatch(
        Guid productId, string batchCode, DateTime harvestDate,
        string originLocation, string? processingDetails = null, string? blockchainHash = null)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        BatchCode = batchCode;
        HarvestDate = harvestDate;
        OriginLocation = originLocation;
        ProcessingDetails = processingDetails;
        BlockchainHash = blockchainHash;
    }

    /// <summary>
    /// Updates mutable batch fields. Only non-null values are applied.
    /// </summary>
    public void Update(DateTime? harvestDate, string? originLocation, string? processingDetails, string? blockchainHash)
    {
        if (harvestDate.HasValue) HarvestDate = harvestDate.Value;
        if (originLocation != null) OriginLocation = originLocation;
        if (processingDetails != null) ProcessingDetails = processingDetails;
        if (blockchainHash != null) BlockchainHash = blockchainHash;
    }
}
