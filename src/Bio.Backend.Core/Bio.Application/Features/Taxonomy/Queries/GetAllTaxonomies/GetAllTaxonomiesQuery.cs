using Bio.Application.DTOs;
using MediatR;

namespace Bio.Application.Features.Taxonomy.Queries.GetAllTaxonomies;

public record GetAllTaxonomiesQuery : IRequest<IEnumerable<TaxonomyResponseDTO>>;

public class GetAllTaxonomiesQueryHandler : IRequestHandler<GetAllTaxonomiesQuery, IEnumerable<TaxonomyResponseDTO>>
{
    private readonly Bio.Domain.Interfaces.ITaxonomyRepository _repository;
    private readonly AutoMapper.IMapper _mapper;

    public GetAllTaxonomiesQueryHandler(Bio.Domain.Interfaces.ITaxonomyRepository repository, AutoMapper.IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<TaxonomyResponseDTO>> Handle(GetAllTaxonomiesQuery request, CancellationToken cancellationToken)
    {
        var list = await _repository.GetAllAsync(cancellationToken);
        return _mapper.Map<IEnumerable<TaxonomyResponseDTO>>(list);
    }
}
