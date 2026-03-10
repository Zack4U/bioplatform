using System;
using Hangfire;
using Bio.Application.Common.Interfaces;
using Bio.Domain.Interfaces;

namespace Bio.Infrastructure.Services;

public class JobEnqueuer : IJobEnqueuer
{
    private readonly IBackgroundJobClient _backgroundJobClient;

    public JobEnqueuer(IBackgroundJobClient backgroundJobClient)
    {
        _backgroundJobClient = backgroundJobClient;
    }

    public string EnqueueSpeciesBulkImportJob(string filePath, Guid userId)
    {
        return _backgroundJobClient.Enqueue<ISpeciesBulkImportJob>(
            job => job.ProcessCsvImportAsync(filePath, userId));
    }
}
