using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

public class SpeciesImageRepository : ISpeciesImageRepository
{
    private readonly ScientificDbContext _context;

    public SpeciesImageRepository(ScientificDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<SpeciesImage> Items, int TotalCount)> GetBySpeciesIdAsync(
        Guid speciesId,
        bool onlyValidatedByExpert = true,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _context.SpeciesImages
            .AsNoTracking()
            .Where(img => img.SpeciesId == speciesId);

        if (onlyValidatedByExpert)
        {
            query = query.Where(img => img.IsValidatedByExpert);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Primary images first, then by creation date descending
        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 100);

        var items = await query
            .OrderByDescending(img => img.IsPrimary)
            .ThenByDescending(img => img.CreatedAt)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
