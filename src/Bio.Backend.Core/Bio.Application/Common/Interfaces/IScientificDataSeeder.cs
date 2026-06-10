using System.Threading;
using System.Threading.Tasks;

namespace Bio.Application.Common.Interfaces;

/// <summary>
/// Idempotently populates the PostgreSQL scientific catalog from the data files shipped with the
/// repository: species (CSV), economic potential (JSON), traditional uses (JSON) and procedurally
/// generated geographic distributions. Safe to run on every startup — it no-ops when data is present.
/// </summary>
public interface IScientificDataSeeder
{
    Task SeedAsync(CancellationToken cancellationToken = default);
}
