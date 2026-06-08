using Bio.Domain.Interfaces;
using System.Net.Http.Json;
using MediatR;

namespace Bio.Application.Features.AiModels.Commands.DeleteModelVersion;

/// <summary>
/// Command to soft-delete a model version (MLOps traceability — the record is
/// kept with is_deleted=true, never physically removed). If the deleted version
/// was active, the AI service is suspended so it stops serving that model.
/// </summary>
public record DeleteModelVersionCommand(int ModelVersionId) : IRequest<DeleteModelVersionResult>;

public record DeleteModelVersionResult(
    bool Success,
    string Message
);

public class DeleteModelVersionCommandHandler
    : IRequestHandler<DeleteModelVersionCommand, DeleteModelVersionResult>
{
    private readonly IAiModelRepository _repo;
    private readonly IScientificUnitOfWork _unitOfWork;
    private readonly IHttpClientFactory _httpClientFactory;

    public DeleteModelVersionCommandHandler(
        IAiModelRepository repo,
        IScientificUnitOfWork unitOfWork,
        IHttpClientFactory httpClientFactory)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<DeleteModelVersionResult> Handle(
        DeleteModelVersionCommand request,
        CancellationToken cancellationToken)
    {
        var version = await _repo.GetVersionByIdAsync(request.ModelVersionId, cancellationToken);
        if (version is null)
            return new DeleteModelVersionResult(false, "Model version not found.");

        if (version.IsDeleted)
            return new DeleteModelVersionResult(true, $"Version '{version.Version}' was already deleted.");

        var wasActive = version.IsActive;

        // SoftDelete also clears IsActive (see AiModelVersion.SoftDelete()).
        version.SoftDelete();
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Only suspend the AI service if we just removed the active model.
        if (!wasActive)
            return new DeleteModelVersionResult(
                true, $"Version '{version.Version}' deleted.");

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
                return new DeleteModelVersionResult(
                    true,
                    $"Active version '{version.Version}' deleted in DB but AI suspend failed ({response.StatusCode}). "
                    + "Inference will stop on next AI service restart.");
            }
        }
        catch (Exception ex)
        {
            return new DeleteModelVersionResult(
                true,
                $"Active version '{version.Version}' deleted in DB but AI suspend failed: {ex.Message}. "
                + "Inference will stop on next AI service restart.");
        }

        return new DeleteModelVersionResult(
            true,
            $"Active version '{version.Version}' deleted and AI classification suspended.");
    }
}
