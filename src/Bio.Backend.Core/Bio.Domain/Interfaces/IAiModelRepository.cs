using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repository for AI model versions and training jobs (PostgreSQL).
/// Manages versioned model records and training job tracking.
/// </summary>
public interface IAiModelRepository
{
    // -- AiModelVersion --

    /// <summary>Get all non-deleted model versions ordered by creation date descending.</summary>
    Task<IEnumerable<AiModelVersion>> GetAllVersionsAsync(CancellationToken ct = default);

    /// <summary>Get a specific model version by its ID.</summary>
    Task<AiModelVersion?> GetVersionByIdAsync(int id, CancellationToken ct = default);

    /// <summary>Get a specific model version by its version tag.</summary>
    Task<AiModelVersion?> GetVersionByTagAsync(string version, CancellationToken ct = default);

    /// <summary>Get the currently active model version (only one should exist).</summary>
    Task<AiModelVersion?> GetActiveVersionAsync(CancellationToken ct = default);

    /// <summary>Add a new model version.</summary>
    Task AddVersionAsync(AiModelVersion version, CancellationToken ct = default);

    /// <summary>Deactivate all currently active versions (used before activating a new one).</summary>
    Task DeactivateAllAsync(CancellationToken ct = default);

    // -- AiTrainingJob --

    /// <summary>Get a training job by its ID.</summary>
    Task<AiTrainingJob?> GetTrainingJobAsync(Guid jobId, CancellationToken ct = default);

    /// <summary>Add a new training job record.</summary>
    Task AddTrainingJobAsync(AiTrainingJob job, CancellationToken ct = default);

    /// <summary>Get all training jobs ordered by started_at descending.</summary>
    Task<IEnumerable<AiTrainingJob>> GetRecentTrainingJobsAsync(int count = 10, CancellationToken ct = default);
}
