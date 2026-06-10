namespace Bio.Domain.Entities;

public class PredictionLog
{
    public Guid Id { get; private set; }
    public Guid? UserId { get; private set; }
    public string ImageInputUrl { get; private set; } = string.Empty;
    public string RawPredictionResult { get; private set; } = string.Empty; // JSONB
    public Guid? TopPredictionSpeciesId { get; private set; }
    public decimal ConfidenceScore { get; private set; }
    public bool? FeedbackCorrect { get; private set; }
    public Guid? FeedbackActualSpeciesId { get; private set; }
    public int? ProcessingTimeMs { get; private set; }
    public string? ModelVersion { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private PredictionLog() { }

    public PredictionLog(string imageInputUrl, string rawPredictionResult, decimal confidenceScore)
    {
        Id = Guid.NewGuid();
        ImageInputUrl = imageInputUrl;
        RawPredictionResult = rawPredictionResult;
        ConfidenceScore = confidenceScore;
    }
}
