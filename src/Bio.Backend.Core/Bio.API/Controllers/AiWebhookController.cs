using Bio.Application.Features.AiModels.Commands.ReceiveTrainingWebhook;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Bio.API.Controllers;

/// <summary>
/// Webhook endpoint called by the AI microservice when training completes.
/// No authentication required (internal network only — secure via network policy).
/// Idempotent: duplicate webhooks for the same jobId are safe no-ops.
/// </summary>
[ApiController]
[Route("api/webhooks/ai")]
public class AiWebhookController : ControllerBase
{
    private readonly IMediator _mediator;
    public AiWebhookController(IMediator mediator) => _mediator = mediator;

    /// <summary>Receive training completion notification from AI microservice.</summary>
    [HttpPost("training-completed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TrainingCompleted(
        [FromBody] TrainingCompletedWebhookDto dto,
        CancellationToken ct)
    {
        var command = new ReceiveTrainingWebhookCommand(
            JobId: dto.JobId,
            Status: dto.Status,
            StatusMessage: dto.StatusMessage,
            Version: dto.Version,
            Accuracy: dto.Accuracy,
            ConfigJson: dto.ConfigJson,
            MetricsJson: dto.MetricsJson);

        var result = await _mediator.Send(command, ct);
        return result.Accepted ? Ok(result) : BadRequest(result);
    }
}

/// <summary>Payload from the AI microservice training webhook.</summary>
public record TrainingCompletedWebhookDto(
    string JobId,
    string Status,
    string StatusMessage,
    string? Version = null,
    decimal? Accuracy = null,
    string? ConfigJson = null,
    string? MetricsJson = null
);
