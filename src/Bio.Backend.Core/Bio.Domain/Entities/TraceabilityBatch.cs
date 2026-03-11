namespace Bio.Domain.Entities;

public class TraceabilityBatch
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string BatchCode { get; private set; } = string.Empty;
    public DateTime HarvestDate { get; private set; }
    public string OriginLocation { get; private set; } = string.Empty;
    public string? ProcessingDetails { get; private set; }
    public string? BlockchainHash { get; private set; }

    public Product Product { get; private set; } = null!;

    private TraceabilityBatch() { }

    public TraceabilityBatch(Guid productId, string batchCode, DateTime harvestDate, string originLocation)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        BatchCode = batchCode;
        HarvestDate = harvestDate;
        OriginLocation = originLocation;
    }
}
