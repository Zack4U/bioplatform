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

    /// <summary>Soft delete for traceability — never physically remove model records.</summary>
    public bool IsDeleted { get; private set; } = false;

    /// <summary>Full training_config.json stored as jsonb for perpetual auditing.</summary>
    public string? ConfigJson { get; private set; }

    /// <summary>Full evaluation_metrics.json stored as jsonb for perpetual auditing.</summary>
    public string? MetricsJson { get; private set; }

    /// <summary>Accuracy from pre-activation validation (Checkpoint Guard).</summary>
    public decimal? ValidationAccuracy { get; private set; }

    // Navigation
    public ICollection<AiTrainingJob> TrainingJobs { get; private set; } = new List<AiTrainingJob>();

    private AiModelVersion() { }

    public AiModelVersion(
        string modelName,
        string version,
        decimal accuracyMetric,
        DateTime deployedAt,
        bool isActive = false,
        string? notes = null,
        string? configJson = null,
        string? metricsJson = null)
    {
        ModelName = modelName;
        Version = version;
        AccuracyMetric = accuracyMetric;
        DeployedAt = deployedAt;
        IsActive = isActive;
        Notes = notes;
        ConfigJson = configJson;
        MetricsJson = metricsJson;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        IsActive = false;
    }

    public void SetValidationAccuracy(decimal accuracy)
    {
        ValidationAccuracy = accuracy;
    }
}
