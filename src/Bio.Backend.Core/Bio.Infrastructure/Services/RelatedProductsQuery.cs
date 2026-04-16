using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Services;

/// <summary>
/// Implementación de IRelatedProductsQuery que consulta
/// la tabla Products en SQL Server (BioDbContext).
/// </summary>
public class RelatedProductsQuery : IRelatedProductsQuery
{
    private readonly BioDbContext _context;

    public RelatedProductsQuery(BioDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<RelatedProductDTO>> GetBySpeciesIdAsync(
        Guid speciesId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .Where(p => p.BaseSpeciesId == speciesId && p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new RelatedProductDTO(
                p.Id,
                p.Name,
                p.Slug,
                p.Description,
                p.Price,
                p.StockQuantity,
                p.ThumbnailUrl,
                p.IsActive
            ))
            .ToListAsync(cancellationToken);
    }
}
