using Bio.Application.DTOs;
using MediatR;

namespace Bio.Application.Features.Species.Queries.GetAllSpecies;

/// <summary>
/// Query paginada con filtros para el catálogo de especies.
/// </summary>
public record GetAllSpeciesQuery : IRequest<PaginatedResult<SpeciesListItemDTO>>
{
    public string? Query { get; init; }
    public string? Kingdom { get; init; }
    public string? Phylum { get; init; }
    public string? ClassName { get; init; }
    public string? OrderName { get; init; }
    public string? Family { get; init; }
    public string? Genus { get; init; }
    public bool? IsSensitive { get; init; }
    public string? ConservationStatus { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 12;
    public string SortBy { get; init; } = "scientificName";
    public string SortOrder { get; init; } = "asc";
}

public class GetAllSpeciesQueryHandler
    : IRequestHandler<GetAllSpeciesQuery, PaginatedResult<SpeciesListItemDTO>>
{
    private readonly Bio.Domain.Interfaces.ISpeciesRepository _repository;

    public GetAllSpeciesQueryHandler(Bio.Domain.Interfaces.ISpeciesRepository repository)
    {
        _repository = repository;
    }

    public async Task<PaginatedResult<SpeciesListItemDTO>> Handle(
        GetAllSpeciesQuery request,
        CancellationToken cancellationToken)
    {
        var (items, totalCount) = await _repository.GetFilteredAsync(
            query: request.Query,
            kingdom: request.Kingdom,
            phylum: request.Phylum,
            className: request.ClassName,
            orderName: request.OrderName,
            family: request.Family,
            genus: request.Genus,
            isSensitive: request.IsSensitive,
            conservationStatus: request.ConservationStatus,
            sortBy: request.SortBy,
            sortOrder: request.SortOrder,
            page: request.Page,
            pageSize: request.PageSize,
            cancellationToken: cancellationToken);

        var dtos = items.Select(s => new SpeciesListItemDTO(
            s.Id,
            s.Slug,
            s.ScientificName,
            s.CommonName,
            s.ThumbnailUrl,
            s.ConservationStatus,
            s.IsSensitive,
            s.Taxonomy?.Kingdom,
            s.Taxonomy?.Family,
            s.CreatedAt
        )).ToList();

        return PaginatedResult<SpeciesListItemDTO>.Create(
            dtos,
            totalCount,
            request.Page,
            request.PageSize);
    }
}
