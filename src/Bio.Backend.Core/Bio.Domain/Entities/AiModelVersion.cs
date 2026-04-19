namespace Bio.Domain.Entities;

/// <summary>
/// Versioned record of AI/ML models deployed for species classification.
/// Supports MLOps rollback — only one version can be active at a time.
/// Table: ai_model_versions (PostgreSQL).
/// </summary>
public class AiModelVersion
{
    public int Id { get; private set; }
    public string ModelName { get; private set; } = string.Empty;
    public string Version { get; private set; } = string.Empty;
    public decimal AccuracyMetric { get; private set; }
    public DateTime DeployedAt { get; private set; }
    public bool IsActive { get; private set; } = false;
    public string? Notes { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private AiModelVersion() { }

    public AiModelVersion(string modelName, string version, decimal accuracyMetric, DateTime deployedAt, bool isActive = false, string? notes = null)
    {
        ModelName = modelName;
        Version = version;
        AccuracyMetric = accuracyMetric;
        DeployedAt = deployedAt;
        IsActive = isActive;
        Notes = notes;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}
