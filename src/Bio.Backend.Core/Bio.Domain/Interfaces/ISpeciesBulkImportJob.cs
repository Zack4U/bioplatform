using System.Threading.Tasks;

namespace Bio.Domain.Interfaces;

public interface ISpeciesBulkImportJob
{
    Task ProcessCsvImportAsync(string filePath, Guid userId);
}
