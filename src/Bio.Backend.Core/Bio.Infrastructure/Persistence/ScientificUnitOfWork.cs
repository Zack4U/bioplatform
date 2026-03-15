using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

/// <summary>
/// Unit of Work para el contexto científico (PostgreSQL).
/// </summary>
public class ScientificUnitOfWork : IScientificUnitOfWork
{
    private readonly ScientificDbContext _context;

    public ScientificUnitOfWork(ScientificDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
