using System;

namespace Bio.Application.Common.Interfaces;

public interface IJobEnqueuer
{
    string EnqueueSpeciesBulkImportJob(string filePath, Guid userId);

    /// <summary>Enqueues a background job to bulk-update economic_potential by scientific_name from a JSON file.</summary>
    string EnqueueEconomicPotentialImportJob(string filePath, Guid userId);

    /// <summary>Enqueues a background job to bulk-update traditional_uses by scientific_name from a JSON file.</summary>
    string EnqueueTraditionalUsesImportJob(string filePath, Guid userId);
}
