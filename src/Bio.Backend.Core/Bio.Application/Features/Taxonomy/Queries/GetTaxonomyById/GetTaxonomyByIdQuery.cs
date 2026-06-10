using Bio.Application.DTOs;
using MediatR;

namespace Bio.Application.Features.Taxonomy.Queries.GetTaxonomyById;

public record GetTaxonomyByIdQuery(int Id) : IRequest<TaxonomyResponseDTO>;

public class GetTaxonomyByIdQueryHandler : IRequestHandler<GetTaxonomyByIdQuery, TaxonomyResponseDTO>
{
    private readonly Bio.Domain.Interfaces.ITaxonomyRepository _repository;
    private readonly AutoMapper.IMapper _mapper;

    public GetTaxonomyByIdQueryHandler(Bio.Domain.Interfaces.ITaxonomyRepository repository, AutoMapper.IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<TaxonomyResponseDTO> Handle(GetTaxonomyByIdQuery request, CancellationToken cancellationToken)
    {
        var taxonomy = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new Bio.Domain.Exceptions.NotFoundException($"Taxonomy with id {request.Id} not found.");
        return _mapper.Map<TaxonomyResponseDTO>(taxonomy);
    }
}
