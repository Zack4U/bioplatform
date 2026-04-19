using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Bio.Application.Common.Interfaces;

namespace Bio.Application.Features.Species.Commands;

/// <summary>
/// Enqueues a Hangfire background job to bulk-update the economic_potential column
/// for existing species, matched by scientific_name, from a JSON file.
///
/// The JSON file must follow the structure of species_economic_potential.json:
/// [{ "scientific_name": "...", "economic_potential": [...], "confidence": "..." }]
/// </summary>
public class ImportSpeciesEconomicPotentialCommand : IRequest<string>
{
    public string FilePath { get; set; } = string.Empty;
    public Guid UserId { get; set; }
}

public class ImportSpeciesEconomicPotentialCommandHandler
    : IRequestHandler<ImportSpeciesEconomicPotentialCommand, string>
{
    private readonly IJobEnqueuer _jobEnqueuer;

    public ImportSpeciesEconomicPotentialCommandHandler(IJobEnqueuer jobEnqueuer)
    {
        _jobEnqueuer = jobEnqueuer;
    }

    public Task<string> Handle(
        ImportSpeciesEconomicPotentialCommand request,
        CancellationToken cancellationToken)
    {
        var jobId = _jobEnqueuer.EnqueueEconomicPotentialImportJob(
            request.FilePath, request.UserId);

        return Task.FromResult(jobId);
    }
}
