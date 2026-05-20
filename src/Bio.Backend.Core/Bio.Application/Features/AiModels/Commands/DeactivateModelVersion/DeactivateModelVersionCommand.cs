using Bio.Domain.Interfaces;
using System.Net.Http.Json;
using MediatR;

namespace Bio.Application.Features.AiModels.Commands.DeactivateModelVersion;

/// <summary>
/// Command to deactivate a specific model version.
/// </summary>
public record DeactivateModelVersionCommand(int ModelVersionId) : IRequest<DeactivateModelVersionResult>;

public record DeactivateModelVersionResult(
    bool Success,
    string Message
);

public class DeactivateModelVersionCommandHandler
    : IRequestHandler<DeactivateModelVersionCommand, DeactivateModelVersionResult>
{
    private readonly IAiModelRepository _repo;
    private readonly IScientificUnitOfWork _unitOfWork;
    private readonly IHttpClientFactory _httpClientFactory;

    public DeactivateModelVersionCommandHandler(
        IAiModelRepository repo,
        IScientificUnitOfWork unitOfWork,
        IHttpClientFactory httpClientFactory)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<DeactivateModelVersionResult> Handle(
        DeactivateModelVersionCommand request,
        CancellationToken cancellationToken)
    {
        var version = await _repo.GetVersionByIdAsync(request.ModelVersionId, cancellationToken);
        if (version is null)
            return new DeactivateModelVersionResult(false, "Model version not found.");

        version.Deactivate();
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Trigger hot-reload on AI microservice with an empty/null version to suspend
        try
        {
            var client = _httpClientFactory.CreateClient("AiService");
            var payload = new { version = (string?)null };
            var response = await client.PostAsJsonAsync(
                "/api/v1/model/reload",
                payload,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return new DeactivateModelVersionResult(
                    true,
                    $"Version '{version.Version}' deactivated in DB but AI reload failed ({response.StatusCode}). "
                    + "Model will be deactivated on next AI service restart.");
            }
        }
        catch (Exception ex)
        {
            return new DeactivateModelVersionResult(
                true,
                $"Version '{version.Version}' deactivated in DB but AI reload failed: {ex.Message}. "
                + "Model will be deactivated on next AI service restart.");
        }

        return new DeactivateModelVersionResult(
            true,
            $"Version '{version.Version}' deactivated and hot-reloaded on AI service.");
    }
}
