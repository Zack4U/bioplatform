using System.Threading.Tasks;

namespace Bio.Domain.Interfaces;

public interface ISpeciesBulkImportJob
{
    /// <param name="deleteSourceFile">
    /// When true (default, used by the upload endpoint for temp files) the source file is deleted
    /// after processing. Seeders pass false to keep the catalog data files on disk.
    /// </param>
    Task ProcessCsvImportAsync(string filePath, Guid userId, bool deleteSourceFile = true);

    /// <summary>Reads the JSON file at filePath and bulk-updates economic_potential for matching species.</summary>
    Task ProcessEconomicPotentialImportAsync(string filePath, Guid userId, bool deleteSourceFile = true);

    /// <summary>Reads the JSON file at filePath and bulk-updates traditional_uses for matching species.</summary>
    Task ProcessTraditionalUsesImportAsync(string filePath, Guid userId, bool deleteSourceFile = true);
}
