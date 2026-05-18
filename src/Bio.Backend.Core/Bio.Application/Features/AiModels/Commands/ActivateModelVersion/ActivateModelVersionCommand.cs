using Bio.Domain.Interfaces;
using System.Net.Http.Json;
using MediatR;

namespace Bio.Application.Features.AiModels.Commands.ActivateModelVersion;

/// <summary>
/// Command to activate a specific model version.
/// Deactivates all other versions and triggers hot-reload on the AI microservice.
/// </summary>
public record ActivateModelVersionCommand(int ModelVersionId) : IRequest<ActivateModelVersionResult>;

public record ActivateModelVersionResult(
    bool Success,
    string Message,
    string? ActivatedVersion = null
);

public class ActivateModelVersionCommandHandler
    : IRequestHandler<ActivateModelVersionCommand, ActivateModelVersionResult>
{
    private readonly IAiModelRepository _repo;
    private readonly IScientificUnitOfWork _unitOfWork;
    private readonly IHttpClientFactory _httpClientFactory;

    public ActivateModelVersionCommandHandler(
        IAiModelRepository repo,
        IScientificUnitOfWork unitOfWork,
        IHttpClientFactory httpClientFactory)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<ActivateModelVersionResult> Handle(
        ActivateModelVersionCommand request,
        CancellationToken cancellationToken)
    {
        var version = await _repo.GetVersionByIdAsync(request.ModelVersionId, cancellationToken);
        if (version is null)
            return new ActivateModelVersionResult(false, "Model version not found.");

        // Deactivate all, then activate the requested one
        await _repo.DeactivateAllAsync(cancellationToken);
        version.Activate();
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Trigger hot-reload on AI microservice (Pointer Swap)
        try
        {
            var client = _httpClientFactory.CreateClient("AiService");
            var payload = new { version = version.Version };
            var response = await client.PostAsJsonAsync(
                "/api/v1/model/reload",
                payload,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return new ActivateModelVersionResult(
                    true,
                    $"Version '{version.Version}' activated in DB but AI reload failed ({response.StatusCode}). "
                    + "Model will be loaded on next AI service restart.",
                    version.Version);
            }
        }
        catch (Exception ex)
        {
            return new ActivateModelVersionResult(
                true,
                $"Version '{version.Version}' activated in DB but AI reload failed: {ex.Message}. "
                + "Model will be loaded on next AI service restart.",
                version.Version);
        }

        return new ActivateModelVersionResult(
            true,
            $"Version '{version.Version}' activated and hot-reloaded on AI service.",
            version.Version);
    }
}
