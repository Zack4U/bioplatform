using System.Threading.Tasks;

namespace Bio.Domain.Interfaces;

public interface ISpeciesBulkImportJob
{
    Task ProcessCsvImportAsync(string filePath, Guid userId);

    /// <summary>Reads the JSON file at filePath and bulk-updates economic_potential for matching species.</summary>
    Task ProcessEconomicPotentialImportAsync(string filePath, Guid userId);

    /// <summary>Reads the JSON file at filePath and bulk-updates traditional_uses for matching species.</summary>
    Task ProcessTraditionalUsesImportAsync(string filePath, Guid userId);
}
