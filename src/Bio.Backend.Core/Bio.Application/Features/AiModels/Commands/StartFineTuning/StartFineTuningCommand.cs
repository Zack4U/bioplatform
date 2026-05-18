using Bio.Domain.Interfaces;
using System.Net.Http.Json;
using MediatR;

namespace Bio.Application.Features.AiModels.Commands.StartFineTuning;

/// <summary>
/// Command to create a new AiTrainingJob and trigger fine-tuning on the AI microservice.
/// The AI microservice runs training in background and calls back via webhook on completion.
/// </summary>
public record StartFineTuningCommand(
    Guid TriggeredByUserId,
    int? Epochs = null,
    double? LearningRate = null,
    double? ReplayBufferRatio = null
) : IRequest<StartFineTuningResult>;

public record StartFineTuningResult(
    Guid JobId,
    string Status,
    string Message
);

public class StartFineTuningCommandHandler : IRequestHandler<StartFineTuningCommand, StartFineTuningResult>
{
    private readonly IAiModelRepository _repo;
    private readonly IScientificUnitOfWork _unitOfWork;
    private readonly IHttpClientFactory _httpClientFactory;

    public StartFineTuningCommandHandler(
        IAiModelRepository repo,
        IScientificUnitOfWork unitOfWork,
        IHttpClientFactory httpClientFactory)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<StartFineTuningResult> Handle(
        StartFineTuningCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Create training job record
        var job = new Bio.Domain.Entities.AiTrainingJob(request.TriggeredByUserId);
        job.MarkRunning();
        await _repo.AddTrainingJobAsync(job, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 2. Call AI microservice to start fine-tuning
        try
        {
            var client = _httpClientFactory.CreateClient("AiService");
            var payload = new
            {
                job_id = job.Id.ToString(),
                epochs = request.Epochs,
                learning_rate = request.LearningRate,
                replay_buffer_ratio = request.ReplayBufferRatio,
            };

            var response = await client.PostAsJsonAsync(
                "/api/v1/training/finetune",
                payload,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                job.MarkFailed($"AI service rejected: {response.StatusCode} - {errorBody}");
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                return new StartFineTuningResult(
                    job.Id,
                    "Failed",
                    $"AI service rejected request: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            job.MarkFailed($"Failed to contact AI service: {ex.Message}");
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new StartFineTuningResult(
                job.Id,
                "Failed",
                $"Cannot reach AI microservice: {ex.Message}");
        }

        return new StartFineTuningResult(
            job.Id,
            "Running",
            "Fine-tuning started. Results will be sent via webhook.");
    }
}
