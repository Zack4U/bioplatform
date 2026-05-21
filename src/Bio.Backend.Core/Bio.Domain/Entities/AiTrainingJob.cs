namespace Bio.Domain.Entities;

/// <summary>
/// Tracks asynchronous AI training jobs (fine-tuning runs).
/// Table: ai_training_jobs (PostgreSQL).
/// Status flow: Pending -> Running -> Completed | Failed | Interrupted.
/// </summary>
public class AiTrainingJob
{
    public Guid Id { get; private set; }
    public DateTime StartedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; private set; }
    public string Status { get; private set; } = "Pending";
    public string? StatusMessage { get; private set; }
    public Guid TriggeredByUserId { get; private set; }
    public int? ResultingModelVersionId { get; private set; }

    // Navigation
    public AiModelVersion? ResultingModelVersion { get; private set; }

    private AiTrainingJob() { }

    public AiTrainingJob(Guid triggeredByUserId)
    {
        Id = Guid.NewGuid();
        TriggeredByUserId = triggeredByUserId;
        Status = "Pending";
    }

    public void MarkRunning()
    {
        Status = "Running";
    }

    public void UpdateStatusMessage(string message)
    {
        Status = "Running";
        StatusMessage = message;
    }

    public void MarkCompleted(string statusMessage, int? modelVersionId = null)
    {
        Status = "Completed";
        StatusMessage = statusMessage;
        CompletedAt = DateTime.UtcNow;
        ResultingModelVersionId = modelVersionId;
    }

    public void MarkFailed(string statusMessage)
    {
        Status = "Failed";
        StatusMessage = statusMessage;
        CompletedAt = DateTime.UtcNow;
    }

    public void MarkInterrupted(string statusMessage)
    {
        Status = "Interrupted";
        StatusMessage = statusMessage;
        CompletedAt = DateTime.UtcNow;
    }
}
