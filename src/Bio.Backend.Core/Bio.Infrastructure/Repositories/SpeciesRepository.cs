using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

public class SpeciesRepository : ISpeciesRepository
{
    private readonly ScientificDbContext _context;

    public SpeciesRepository(ScientificDbContext context)
    {
        _context = context;
    }

    public async Task<Species?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Species
            .Include(s => s.Taxonomy)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Species?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        return await _context.Species
            .Include(s => s.Taxonomy)
            .FirstOrDefaultAsync(s => s.Slug == slug, cancellationToken);
    }

    public async Task<Species?> GetByScientificNameAsync(string scientificName, CancellationToken cancellationToken = default)
    {
        return await _context.Species
            .Include(s => s.Taxonomy)
            .FirstOrDefaultAsync(s => s.ScientificName == scientificName, cancellationToken);
    }

    public async Task<IEnumerable<Species>> GetAllAsync(int? skip = null, int? take = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Species.Include(s => s.Taxonomy).OrderBy(s => s.ScientificName).AsQueryable();
        if (skip.HasValue) query = query.Skip(skip.Value);
        if (take.HasValue) query = query.Take(take.Value);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Species?> GetByIdWithDistributionsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Species
            .Include(s => s.Taxonomy)
            .Include(s => s.GeographicDistributions)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Species?> GetBySlugWithDistributionsAsync(string slug, CancellationToken cancellationToken = default)
    {
        return await _context.Species
            .Include(s => s.Taxonomy)
            .Include(s => s.GeographicDistributions)
            .FirstOrDefaultAsync(s => s.Slug == slug, cancellationToken);
    }

    public async Task<(IReadOnlyList<Species> Items, int TotalCount)> GetFilteredAsync(
        string? query = null,
        string? kingdom = null,
        string? phylum = null,
        string? family = null,
        string? genus = null,
        bool? isSensitive = null,
        string? conservationStatus = null,
        string sortBy = "scientificName",
        string sortOrder = "asc",
        int page = 1,
        int pageSize = 12,
        CancellationToken cancellationToken = default)
    {
        var q = _context.Species
            .Include(s => s.Taxonomy)
            .AsQueryable();

        // Text search (scientific name, common name, description)
        if (!string.IsNullOrWhiteSpace(query))
        {
            var searchTerm = query.ToLower();
            q = q.Where(s =>
                s.ScientificName.ToLower().Contains(searchTerm) ||
                (s.CommonName != null && s.CommonName.ToLower().Contains(searchTerm)) ||
                (s.Description != null && s.Description.ToLower().Contains(searchTerm)) ||
                (s.Taxonomy != null && s.Taxonomy.Family != null && s.Taxonomy.Family.ToLower().Contains(searchTerm)) ||
                (s.Taxonomy != null && s.Taxonomy.Genus != null && s.Taxonomy.Genus.ToLower().Contains(searchTerm)));
        }

        // Taxonomy filters
        if (!string.IsNullOrWhiteSpace(kingdom))
            q = q.Where(s => s.Taxonomy != null && s.Taxonomy.Kingdom == kingdom);

        if (!string.IsNullOrWhiteSpace(phylum))
            q = q.Where(s => s.Taxonomy != null && s.Taxonomy.Phylum == phylum);

        if (!string.IsNullOrWhiteSpace(family))
            q = q.Where(s => s.Taxonomy != null && s.Taxonomy.Family == family);

        if (!string.IsNullOrWhiteSpace(genus))
            q = q.Where(s => s.Taxonomy != null && s.Taxonomy.Genus == genus);

        // Boolean filters
        if (isSensitive.HasValue)
            q = q.Where(s => s.IsSensitive == isSensitive.Value);

        if (!string.IsNullOrWhiteSpace(conservationStatus))
            q = q.Where(s => s.ConservationStatus == conservationStatus);

        // Total count before pagination
        var totalCount = await q.CountAsync(cancellationToken);

        // Sorting
        q = sortBy?.ToLower() switch
        {
            "commonname" => sortOrder == "desc"
                ? q.OrderByDescending(s => s.CommonName)
                : q.OrderBy(s => s.CommonName),
            "createdat" => sortOrder == "desc"
                ? q.OrderByDescending(s => s.CreatedAt)
                : q.OrderBy(s => s.CreatedAt),
            _ => sortOrder == "desc"
                ? q.OrderByDescending(s => s.ScientificName)
                : q.OrderBy(s => s.ScientificName),
        };

        // Pagination
        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 100);
        var items = await q
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<Species> AddAsync(Species species, CancellationToken cancellationToken = default)
    {
        await _context.Species.AddAsync(species, cancellationToken);
        return species;
    }

    public async Task AddRangeAsync(IEnumerable<Species> speciesList, CancellationToken cancellationToken = default)
    {
        await _context.Species.AddRangeAsync(speciesList, cancellationToken);
    }

    public Task DeleteAsync(Species species, CancellationToken cancellationToken = default)
    {
        _context.Species.Remove(species);
        return Task.CompletedTask;
    }

    public async Task<bool> ExistsByScientificNameExcludingIdAsync(string scientificName, Guid excludeId, CancellationToken cancellationToken = default)
    {
        return await _context.Species.AnyAsync(s => s.ScientificName == scientificName && s.Id != excludeId, cancellationToken);
    }

    public async Task<bool> ExistsBySlugExcludingIdAsync(string slug, Guid excludeId, CancellationToken cancellationToken = default)
    {
        return await _context.Species.AnyAsync(s => s.Slug == slug && s.Id != excludeId, cancellationToken);
    }

    public async Task<HashSet<string>> ExistingScientificNamesAsync(IEnumerable<string> names, CancellationToken cancellationToken = default)
    {
        var nameList = names.ToList();
        var existing = await _context.Species
            .Where(s => nameList.Contains(s.ScientificName))
            .Select(s => s.ScientificName)
            .ToListAsync(cancellationToken);
        return new HashSet<string>(existing);
    }

    public async Task<(
        IReadOnlyList<string> Kingdoms,
        IReadOnlyList<string> Phylums,
        IReadOnlyList<string> Families,
        IReadOnlyList<string> Genera,
        IReadOnlyList<string> ConservationStatuses,
        int TotalCount
    )> GetFilterMetaAsync(CancellationToken cancellationToken = default)
    {
        var totalCount = await _context.Species.CountAsync(cancellationToken);

        var kingdoms = await _context.Taxonomies
            .Where(t => t.Kingdom != null)
            .Select(t => t.Kingdom!)
            .Distinct()
            .OrderBy(k => k)
            .ToListAsync(cancellationToken);

        var phylums = await _context.Taxonomies
            .Where(t => t.Phylum != null)
            .Select(t => t.Phylum!)
            .Distinct()
            .OrderBy(p => p)
            .ToListAsync(cancellationToken);

        var families = await _context.Taxonomies
            .Where(t => t.Family != null)
            .Select(t => t.Family!)
            .Distinct()
            .OrderBy(f => f)
            .ToListAsync(cancellationToken);

        var genera = await _context.Taxonomies
            .Where(t => t.Genus != null)
            .Select(t => t.Genus!)
            .Distinct()
            .OrderBy(g => g)
            .ToListAsync(cancellationToken);

        var conservationStatuses = await _context.Species
            .Where(s => s.ConservationStatus != null)
            .Select(s => s.ConservationStatus!)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync(cancellationToken);

        return (kingdoms, phylums, families, genera, conservationStatuses, totalCount);
    }
}
