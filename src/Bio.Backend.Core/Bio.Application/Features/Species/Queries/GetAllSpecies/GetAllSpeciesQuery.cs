using Bio.Application.DTOs;
using MediatR;

namespace Bio.Application.Features.Species.Queries.GetAllSpecies;

public record GetAllSpeciesQuery(int? Skip = null, int? Take = null) : IRequest<IEnumerable<SpeciesResponseDTO>>;

public class GetAllSpeciesQueryHandler : IRequestHandler<GetAllSpeciesQuery, IEnumerable<SpeciesResponseDTO>>
{
    private readonly Bio.Domain.Interfaces.ISpeciesRepository _repository;
    private readonly AutoMapper.IMapper _mapper;

    public GetAllSpeciesQueryHandler(Bio.Domain.Interfaces.ISpeciesRepository repository, AutoMapper.IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<SpeciesResponseDTO>> Handle(GetAllSpeciesQuery request, CancellationToken cancellationToken)
    {
        var list = await _repository.GetAllAsync(request.Skip, request.Take, cancellationToken);
        return _mapper.Map<IEnumerable<SpeciesResponseDTO>>(list);
    }
}
