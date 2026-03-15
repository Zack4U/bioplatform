using Bio.Application.DTOs;
using MediatR;

namespace Bio.Application.Features.Species.Queries.GetSpeciesById;

public record GetSpeciesByIdQuery(Guid Id) : IRequest<SpeciesResponseDTO>;

public class GetSpeciesByIdQueryHandler : IRequestHandler<GetSpeciesByIdQuery, SpeciesResponseDTO>
{
    private readonly Bio.Domain.Interfaces.ISpeciesRepository _repository;
    private readonly AutoMapper.IMapper _mapper;

    public GetSpeciesByIdQueryHandler(Bio.Domain.Interfaces.ISpeciesRepository repository, AutoMapper.IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<SpeciesResponseDTO> Handle(GetSpeciesByIdQuery request, CancellationToken cancellationToken)
    {
        var species = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new Bio.Domain.Exceptions.NotFoundException($"Species with id {request.Id} not found.");
        return _mapper.Map<SpeciesResponseDTO>(species);
    }
}
