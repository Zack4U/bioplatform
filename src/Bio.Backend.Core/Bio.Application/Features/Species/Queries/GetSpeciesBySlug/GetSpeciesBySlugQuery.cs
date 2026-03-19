using Bio.Application.DTOs;
using MediatR;

namespace Bio.Application.Features.Species.Queries.GetSpeciesBySlug;

public record GetSpeciesBySlugQuery(string Slug) : IRequest<SpeciesResponseDTO>;

public class GetSpeciesBySlugQueryHandler : IRequestHandler<GetSpeciesBySlugQuery, SpeciesResponseDTO>
{
    private readonly Bio.Domain.Interfaces.ISpeciesRepository _repository;
    private readonly AutoMapper.IMapper _mapper;

    public GetSpeciesBySlugQueryHandler(Bio.Domain.Interfaces.ISpeciesRepository repository, AutoMapper.IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<SpeciesResponseDTO> Handle(GetSpeciesBySlugQuery request, CancellationToken cancellationToken)
    {
        var species = await _repository.GetBySlugAsync(request.Slug, cancellationToken)
            ?? throw new Bio.Domain.Exceptions.NotFoundException($"Species with slug '{request.Slug}' not found.");
        return _mapper.Map<SpeciesResponseDTO>(species);
    }
}
