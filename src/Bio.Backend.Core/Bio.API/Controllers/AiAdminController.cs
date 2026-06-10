using Bio.Application.Features.AiModels.Commands.ActivateModelVersion;
using Bio.Application.Features.AiModels.Commands.DeactivateModelVersion;
using Bio.Application.Features.AiModels.Commands.DeleteModelVersion;
using Bio.Application.Features.AiModels.Commands.StartFineTuning;
using Bio.Application.Features.AiModels.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// Admin endpoints for AI model management: hardware status, model versions,
/// training jobs, activation, and fine-tuning triggers.
/// </summary>
[ApiController]
[Route("api/v1/ai")]
[Authorize(Roles = "ADMIN")]
public class AiAdminController : ControllerBase
{
    private readonly IMediator _mediator;
    public AiAdminController(IMediator mediator) => _mediator = mediator;

    private Guid ActorId => Guid.Parse(User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identity missing."));

    // =========================================================================
    // HARDWARE
    // =========================================================================

    /// <summary>Check GPU/VRAM availability on the AI server.</summary>
    [HttpGet("hardware")]
    [ProducesResponseType(typeof(AiHardwareStatusResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHardwareStatus(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetAiHardwareStatusQuery(), ct));
    }

    // =========================================================================
    // MODEL VERSIONS
    // =========================================================================

    /// <summary>List all model versions (newest first).</summary>
    [HttpGet("models")]
    [ProducesResponseType(typeof(IEnumerable<ModelVersionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetModelVersions(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetModelVersionsQuery(), ct));
    }

    /// <summary>Get the currently active model metrics.</summary>
    [HttpGet("models/active")]
    [ProducesResponseType(typeof(ActiveModelMetricsResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveModelMetrics(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetActiveModelMetricsQuery(), ct));
    }

    /// <summary>
    /// Get count of new observation images and affected species since the active model was deployed.
    /// Used by the admin panel to surface how much new training data has accumulated.
    /// </summary>
    [HttpGet("observations/summary")]
    [ProducesResponseType(typeof(NewObservationsSummaryResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNewObservationsSummary(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetNewObservationsSummaryQuery(), ct));
    }

    /// <summary>Activate a specific model version (deactivates all others, triggers hot-reload).</summary>
    [HttpPost("models/{id}/activate")]
    [ProducesResponseType(typeof(ActivateModelVersionResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ActivateModelVersion(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new ActivateModelVersionCommand(id), ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Deactivate a specific model version.</summary>
    [HttpPost("models/{id}/deactivate")]
    [ProducesResponseType(typeof(DeactivateModelVersionResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeactivateModelVersion(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeactivateModelVersionCommand(id), ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Soft-delete a model version (suspends AI if it was active).</summary>
    [HttpDelete("models/{id}")]
    [ProducesResponseType(typeof(DeleteModelVersionResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteModelVersion(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteModelVersionCommand(id), ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // =========================================================================
    // TRAINING JOBS
    // =========================================================================

    /// <summary>List recent training jobs.</summary>
    [HttpGet("training/jobs")]
    [ProducesResponseType(typeof(IEnumerable<TrainingJobDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecentTrainingJobs(
        [FromQuery] int count = 10,
        CancellationToken ct = default)
    {
        return Ok(await _mediator.Send(new GetRecentTrainingJobsQuery(count), ct));
    }

    /// <summary>Trigger fine-tuning on the AI microservice.</summary>
    [HttpPost("training/start")]
    [ProducesResponseType(typeof(StartFineTuningResult), StatusCodes.Status202Accepted)]
    public async Task<IActionResult> StartFineTuning(
        [FromBody] StartFineTuningRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new StartFineTuningCommand(
            TriggeredByUserId: ActorId,
            Epochs: request.Epochs,
            LearningRate: request.LearningRate,
            ReplayBufferRatio: request.ReplayBufferRatio), ct);

        return result.Status == "Running"
            ? AcceptedAtAction(nameof(GetRecentTrainingJobs), null, result)
            : BadRequest(result);
    }
}

/// <summary>Request body for starting fine-tuning.</summary>
public record StartFineTuningRequest(
    int? Epochs = null,
    double? LearningRate = null,
    double? ReplayBufferRatio = null
);
