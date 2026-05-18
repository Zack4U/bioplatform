using Bio.Domain.Interfaces;
using System.Net.Http.Json;
using MediatR;

namespace Bio.Application.Features.AiModels.Queries;

// ==========================================================================
// GetAiHardwareStatus — proxies to the AI microservice /system/hardware
// ==========================================================================

public record GetAiHardwareStatusQuery() : IRequest<AiHardwareStatusResult>;

public record AiHardwareStatusResult(
    bool HasGpu,
    string? GpuName,
    double VramTotalGb,
    double VramFreeGb,
    bool CanTrainModels
);

public class GetAiHardwareStatusQueryHandler
    : IRequestHandler<GetAiHardwareStatusQuery, AiHardwareStatusResult>
{
    private readonly IHttpClientFactory _httpClientFactory;

    public GetAiHardwareStatusQueryHandler(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<AiHardwareStatusResult> Handle(
        GetAiHardwareStatusQuery request,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient("AiService");

        try
        {
            var response = await client.GetAsync("/api/v1/system/hardware", cancellationToken);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadFromJsonAsync<AiHardwareStatusResult>(cancellationToken);
            return json ?? new AiHardwareStatusResult(false, null, 0, 0, false);
        }
        catch
        {
            return new AiHardwareStatusResult(false, null, 0, 0, false);
        }
    }
}

// ==========================================================================
// GetActiveModelMetrics — returns the currently active model version info
// ==========================================================================

public record GetActiveModelMetricsQuery() : IRequest<ActiveModelMetricsResult>;

public record ActiveModelMetricsResult(
    bool HasActiveModel,
    int? ModelVersionId,
    string? ModelName,
    string? Version,
    decimal? AccuracyMetric,
    decimal? ValidationAccuracy,
    DateTime? DeployedAt,
    string? Notes
);

public class GetActiveModelMetricsQueryHandler
    : IRequestHandler<GetActiveModelMetricsQuery, ActiveModelMetricsResult>
{
    private readonly IAiModelRepository _repo;

    public GetActiveModelMetricsQueryHandler(IAiModelRepository repo)
    {
        _repo = repo;
    }

    public async Task<ActiveModelMetricsResult> Handle(
        GetActiveModelMetricsQuery request,
        CancellationToken cancellationToken)
    {
        var active = await _repo.GetActiveVersionAsync(cancellationToken);

        if (active is null)
        {
            return new ActiveModelMetricsResult(
                HasActiveModel: false,
                ModelVersionId: null,
                ModelName: null,
                Version: null,
                AccuracyMetric: null,
                ValidationAccuracy: null,
                DeployedAt: null,
                Notes: null);
        }

        return new ActiveModelMetricsResult(
            HasActiveModel: true,
            ModelVersionId: active.Id,
            ModelName: active.ModelName,
            Version: active.Version,
            AccuracyMetric: active.AccuracyMetric,
            ValidationAccuracy: active.ValidationAccuracy,
            DeployedAt: active.DeployedAt,
            Notes: active.Notes);
    }
}

// ==========================================================================
// GetModelVersions — list all model versions
// ==========================================================================

public record GetModelVersionsQuery() : IRequest<IEnumerable<ModelVersionDto>>;

public record ModelVersionDto(
    int Id,
    string ModelName,
    string Version,
    decimal AccuracyMetric,
    decimal? ValidationAccuracy,
    DateTime DeployedAt,
    bool IsActive,
    string? Notes,
    DateTime CreatedAt
);

public class GetModelVersionsQueryHandler
    : IRequestHandler<GetModelVersionsQuery, IEnumerable<ModelVersionDto>>
{
    private readonly IAiModelRepository _repo;

    public GetModelVersionsQueryHandler(IAiModelRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<ModelVersionDto>> Handle(
        GetModelVersionsQuery request,
        CancellationToken cancellationToken)
    {
        var versions = await _repo.GetAllVersionsAsync(cancellationToken);

        return versions.Select(v => new ModelVersionDto(
            v.Id,
            v.ModelName,
            v.Version,
            v.AccuracyMetric,
            v.ValidationAccuracy,
            v.DeployedAt,
            v.IsActive,
            v.Notes,
            v.CreatedAt));
    }
}

// ==========================================================================
// GetRecentTrainingJobs — list recent training jobs
// ==========================================================================

public record GetRecentTrainingJobsQuery(int Count = 10) : IRequest<IEnumerable<TrainingJobDto>>;

public record TrainingJobDto(
    Guid Id,
    DateTime StartedAt,
    DateTime? CompletedAt,
    string Status,
    string? StatusMessage,
    Guid TriggeredByUserId,
    string? ResultingVersion
);

public class GetRecentTrainingJobsQueryHandler
    : IRequestHandler<GetRecentTrainingJobsQuery, IEnumerable<TrainingJobDto>>
{
    private readonly IAiModelRepository _repo;

    public GetRecentTrainingJobsQueryHandler(IAiModelRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<TrainingJobDto>> Handle(
        GetRecentTrainingJobsQuery request,
        CancellationToken cancellationToken)
    {
        var jobs = await _repo.GetRecentTrainingJobsAsync(request.Count, cancellationToken);

        return jobs.Select(j => new TrainingJobDto(
            j.Id,
            j.StartedAt,
            j.CompletedAt,
            j.Status,
            j.StatusMessage,
            j.TriggeredByUserId,
            j.ResultingModelVersion?.Version));
    }
}
