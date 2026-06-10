using Bio.Application.DTOs;
using MediatR;

namespace Bio.Application.Features.Taxonomy.Commands.UpdateTaxonomy;

public record UpdateTaxonomyCommand(int Id, TaxonomyUpdateDTO Dto) : IRequest<TaxonomyResponseDTO>;

public class UpdateTaxonomyCommandHandler : IRequestHandler<UpdateTaxonomyCommand, TaxonomyResponseDTO>
{
    private readonly Bio.Domain.Interfaces.ITaxonomyRepository _repository;
    private readonly Bio.Domain.Interfaces.IScientificUnitOfWork _unitOfWork;
    private readonly AutoMapper.IMapper _mapper;

    public UpdateTaxonomyCommandHandler(
        Bio.Domain.Interfaces.ITaxonomyRepository repository,
        Bio.Domain.Interfaces.IScientificUnitOfWork unitOfWork,
        AutoMapper.IMapper mapper)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<TaxonomyResponseDTO> Handle(UpdateTaxonomyCommand request, CancellationToken cancellationToken)
    {
        var taxonomy = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new Bio.Domain.Exceptions.NotFoundException($"Taxonomy with id {request.Id} not found.");
        var dto = request.Dto;
        taxonomy.Update(dto.Kingdom, dto.Phylum, dto.ClassName, dto.OrderName, dto.Family, dto.Genus);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return _mapper.Map<TaxonomyResponseDTO>(taxonomy);
    }
}
