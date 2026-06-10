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
        // Explicit deleteSourceFile arg: Hangfire expression trees cannot bind optional parameters.
        return _backgroundJobClient.Enqueue<ISpeciesBulkImportJob>(
            job => job.ProcessCsvImportAsync(filePath, userId, true));
    }

    public string EnqueueEconomicPotentialImportJob(string filePath, Guid userId)
    {
        return _backgroundJobClient.Enqueue<ISpeciesBulkImportJob>(
            job => job.ProcessEconomicPotentialImportAsync(filePath, userId, true));
    }

    public string EnqueueTraditionalUsesImportJob(string filePath, Guid userId)
    {
        return _backgroundJobClient.Enqueue<ISpeciesBulkImportJob>(
            job => job.ProcessTraditionalUsesImportAsync(filePath, userId, true));
    }
}
