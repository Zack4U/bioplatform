using System;

namespace Bio.Application.Common.Interfaces;

public interface IJobEnqueuer
{
    string EnqueueSpeciesBulkImportJob(string filePath, Guid userId);
}
