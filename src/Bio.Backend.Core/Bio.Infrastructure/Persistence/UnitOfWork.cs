using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

/// <summary>
/// Implementation of the Unit of Work pattern using Entity Framework Core.
/// Coordinates the work of multiple repositories by creating a single database context class shared by all of them.
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly BioDbContext _context;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(BioDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Asynchronously saves all changes made within the current unit of work to the database.
    /// </summary>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The number of state entries written to the database.</returns>
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Begins a new transaction asynchronously.
    /// </summary>
    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    /// <summary>
    /// Commits the current transaction asynchronously.
    /// </summary>
    public async Task CommitTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    /// <summary>
    /// Rolls back the current transaction asynchronously.
    /// </summary>
    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    /// <summary>
    /// Disposes the context and the transaction.
    /// </summary>
    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
