using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Bio.Application.Common.Interfaces;

namespace Bio.Application.Features.Species.Commands;

public class ImportSpeciesCsvCommand : IRequest<string>
{
    public string FilePath { get; set; } = string.Empty;
    public Guid UserId { get; set; }
}

public class ImportSpeciesCsvCommandHandler : IRequestHandler<ImportSpeciesCsvCommand, string>
{
    private readonly IJobEnqueuer _jobEnqueuer;

    public ImportSpeciesCsvCommandHandler(IJobEnqueuer jobEnqueuer)
    {
        _jobEnqueuer = jobEnqueuer;
    }

    public Task<string> Handle(ImportSpeciesCsvCommand request, CancellationToken cancellationToken)
    {
        // Enqueue the background job using the Infrastructure adapter
        var jobId = _jobEnqueuer.EnqueueSpeciesBulkImportJob(request.FilePath, request.UserId);

        return Task.FromResult(jobId);
    }
}
