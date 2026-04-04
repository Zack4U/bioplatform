using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Species.Queries.GetSpeciesFilterMeta;

/// <summary>
/// Retorna los valores distintos disponibles para los filtros del catálogo de especies.
/// Cached en el frontend con staleTime alto (los filtros cambian con poca frecuencia).
/// </summary>
public record GetSpeciesFilterMetaQuery : IRequest<SpeciesFilterMetaDTO>;

public class GetSpeciesFilterMetaQueryHandler
    : IRequestHandler<GetSpeciesFilterMetaQuery, SpeciesFilterMetaDTO>
{
    private readonly ISpeciesRepository _repository;

    public GetSpeciesFilterMetaQueryHandler(ISpeciesRepository repository)
    {
        _repository = repository;
    }

    public async Task<SpeciesFilterMetaDTO> Handle(
        GetSpeciesFilterMetaQuery request,
        CancellationToken cancellationToken)
    {
        var (kingdoms, phylums, families, genera, conservationStatuses, totalCount) =
            await _repository.GetFilterMetaAsync(cancellationToken);

        return new SpeciesFilterMetaDTO
        {
            Kingdoms = kingdoms,
            Phylums = phylums,
            Families = families,
            Genera = genera,
            ConservationStatuses = conservationStatuses,
            TotalSpeciesCount = totalCount,
        };
    }
}
