using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.AiModels.Commands.ReceiveTrainingWebhook;

/// <summary>
/// Command to process the training completion webhook from the AI microservice.
/// Idempotent: if the job is already completed, the webhook is a no-op.
/// Creates or updates AiModelVersion from the training results.
/// </summary>
public record ReceiveTrainingWebhookCommand(
    string JobId,
    string Status,
    string StatusMessage,
    string? Version,
    decimal? Accuracy,
    string? ConfigJson,
    string? MetricsJson
) : IRequest<ReceiveTrainingWebhookResult>;

public record ReceiveTrainingWebhookResult(
    bool Accepted,
    string Message
);

public class ReceiveTrainingWebhookCommandHandler
    : IRequestHandler<ReceiveTrainingWebhookCommand, ReceiveTrainingWebhookResult>
{
    private readonly IAiModelRepository _repo;
    private readonly IScientificUnitOfWork _unitOfWork;

    public ReceiveTrainingWebhookCommandHandler(
        IAiModelRepository repo,
        IScientificUnitOfWork unitOfWork)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
    }

    public async Task<ReceiveTrainingWebhookResult> Handle(
        ReceiveTrainingWebhookCommand request,
        CancellationToken cancellationToken)
    {
        // Idempotency guard: find the training job
        if (!Guid.TryParse(request.JobId, out var jobId))
            return new ReceiveTrainingWebhookResult(false, "Invalid job ID format.");

        var job = await _repo.GetTrainingJobAsync(jobId, cancellationToken);
        if (job is null)
            return new ReceiveTrainingWebhookResult(false, $"Training job '{request.JobId}' not found.");

        // Idempotency: if job is already in a terminal state, ignore the webhook
        if (job.Status is "Completed" or "Failed" or "Interrupted")
            return new ReceiveTrainingWebhookResult(true, $"Webhook already processed for job '{request.JobId}'.");

        // Update job status
        switch (request.Status)
        {
            case "Completed":
            {
                // Create AiModelVersion record
                int? modelVersionId = null;

                if (!string.IsNullOrEmpty(request.Version))
                {
                    // Extract model name from config JSON
                    var modelName = "efficientnet_b0"; // default
                    if (!string.IsNullOrEmpty(request.ConfigJson))
                    {
                        try
                        {
                            var configDoc = System.Text.Json.JsonDocument.Parse(request.ConfigJson);
                            if (configDoc.RootElement.TryGetProperty("model_name", out var mnProp))
                                modelName = mnProp.GetString() ?? modelName;
                        }
                        catch { /* ignore parse errors */ }
                    }

                    var modelVersion = new AiModelVersion(
                        modelName: modelName,
                        version: request.Version,
                        accuracyMetric: request.Accuracy ?? 0m,
                        deployedAt: DateTime.UtcNow,
                        isActive: false,
                        notes: request.StatusMessage,
                        configJson: request.ConfigJson,
                        metricsJson: request.MetricsJson);

                    await _repo.AddVersionAsync(modelVersion, cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                    modelVersionId = modelVersion.Id;
                }

                job.MarkCompleted(request.StatusMessage, modelVersionId);
                break;
            }
            case "Failed":
                job.MarkFailed(request.StatusMessage);
                break;
            case "Interrupted":
                job.MarkInterrupted(request.StatusMessage);
                break;
            default:
                return new ReceiveTrainingWebhookResult(false, $"Unknown status: '{request.Status}'.");
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ReceiveTrainingWebhookResult(
            true,
            $"Webhook processed: job='{request.JobId}', status='{request.Status}'.");
    }
}
