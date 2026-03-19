using Bio.Application.DTOs;
using MediatR;

namespace Bio.Application.Features.Taxonomy.Commands.CreateTaxonomy;

public record CreateTaxonomyCommand(TaxonomyCreateDTO Dto) : IRequest<TaxonomyResponseDTO>;

public class CreateTaxonomyCommandHandler : IRequestHandler<CreateTaxonomyCommand, TaxonomyResponseDTO>
{
    private readonly Bio.Domain.Interfaces.ITaxonomyRepository _repository;
    private readonly Bio.Domain.Interfaces.IScientificUnitOfWork _unitOfWork;
    private readonly AutoMapper.IMapper _mapper;

    public CreateTaxonomyCommandHandler(
        Bio.Domain.Interfaces.ITaxonomyRepository repository,
        Bio.Domain.Interfaces.IScientificUnitOfWork unitOfWork,
        AutoMapper.IMapper mapper)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<TaxonomyResponseDTO> Handle(CreateTaxonomyCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;
        var taxonomy = new Bio.Domain.Entities.Taxonomy(
            dto.Kingdom,
            dto.Phylum,
            dto.ClassName,
            dto.OrderName,
            dto.Family,
            dto.Genus);
        await _repository.AddAsync(taxonomy, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return _mapper.Map<TaxonomyResponseDTO>(taxonomy);
    }
}
