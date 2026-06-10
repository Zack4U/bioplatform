using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

public class AiModelRepository : IAiModelRepository
{
    private readonly ScientificDbContext _context;

    public AiModelRepository(ScientificDbContext context)
    {
        _context = context;
    }

    // -- AiModelVersion --

    public async Task<IEnumerable<AiModelVersion>> GetAllVersionsAsync(CancellationToken ct = default)
    {
        return await _context.AiModelVersions
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<AiModelVersion?> GetVersionByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.AiModelVersions.FindAsync(new object[] { id }, ct);
    }

    public async Task<AiModelVersion?> GetVersionByTagAsync(string version, CancellationToken ct = default)
    {
        return await _context.AiModelVersions
            .FirstOrDefaultAsync(v => v.Version == version, ct);
    }

    public async Task<AiModelVersion?> GetActiveVersionAsync(CancellationToken ct = default)
    {
        return await _context.AiModelVersions
            .FirstOrDefaultAsync(v => v.IsActive, ct);
    }

    public async Task AddVersionAsync(AiModelVersion version, CancellationToken ct = default)
    {
        await _context.AiModelVersions.AddAsync(version, ct);
    }

    public async Task DeactivateAllAsync(CancellationToken ct = default)
    {
        var activeVersions = await _context.AiModelVersions
            .Where(v => v.IsActive)
            .ToListAsync(ct);

        foreach (var version in activeVersions)
        {
            version.Deactivate();
        }
    }

    // -- AiTrainingJob --

    public async Task<AiTrainingJob?> GetTrainingJobAsync(Guid jobId, CancellationToken ct = default)
    {
        return await _context.AiTrainingJobs
            .Include(j => j.ResultingModelVersion)
            .FirstOrDefaultAsync(j => j.Id == jobId, ct);
    }

    public async Task AddTrainingJobAsync(AiTrainingJob job, CancellationToken ct = default)
    {
        await _context.AiTrainingJobs.AddAsync(job, ct);
    }

    public async Task<IEnumerable<AiTrainingJob>> GetRecentTrainingJobsAsync(int count = 10, CancellationToken ct = default)
    {
        return await _context.AiTrainingJobs
            .Include(j => j.ResultingModelVersion)
            .OrderByDescending(j => j.StartedAt)
            .Take(count)
            .ToListAsync(ct);
    }
}
