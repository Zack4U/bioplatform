namespace Bio.Domain.Interfaces;

/// <summary>
/// Unit of Work para el contexto científico (PostgreSQL: especies, taxonomía, distribución).
/// </summary>
public interface IScientificUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
