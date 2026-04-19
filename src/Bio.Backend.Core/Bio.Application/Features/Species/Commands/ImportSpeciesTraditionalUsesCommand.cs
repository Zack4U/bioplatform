using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Bio.Application.Common.Interfaces;

namespace Bio.Application.Features.Species.Commands;

/// <summary>
/// Enqueues a Hangfire background job to bulk-update the traditional_uses column
/// for existing species, matched by scientific_name, from a JSON file.
///
/// The JSON file must follow the structure of species_traditional_uses.json:
/// [{ "scientific_name": "...", "traditional_uses": [...], "confidence": "..." }]
/// </summary>
public class ImportSpeciesTraditionalUsesCommand : IRequest<string>
{
    public string FilePath { get; set; } = string.Empty;
    public Guid UserId { get; set; }
}

public class ImportSpeciesTraditionalUsesCommandHandler
    : IRequestHandler<ImportSpeciesTraditionalUsesCommand, string>
{
    private readonly IJobEnqueuer _jobEnqueuer;

    public ImportSpeciesTraditionalUsesCommandHandler(IJobEnqueuer jobEnqueuer)
    {
        _jobEnqueuer = jobEnqueuer;
    }

    public Task<string> Handle(
        ImportSpeciesTraditionalUsesCommand request,
        CancellationToken cancellationToken)
    {
        var jobId = _jobEnqueuer.EnqueueTraditionalUsesImportJob(
            request.FilePath, request.UserId);

        return Task.FromResult(jobId);
    }
}
