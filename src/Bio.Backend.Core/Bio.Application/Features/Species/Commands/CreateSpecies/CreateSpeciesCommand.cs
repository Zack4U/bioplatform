using Bio.Application.DTOs;
using MediatR;

namespace Bio.Application.Features.Species.Commands.CreateSpecies;

public record CreateSpeciesCommand(SpeciesCreateDTO Dto) : IRequest<SpeciesResponseDTO>;

public class CreateSpeciesCommandHandler : IRequestHandler<CreateSpeciesCommand, SpeciesResponseDTO>
{
    private readonly Bio.Domain.Interfaces.ISpeciesRepository _repository;
    private readonly Bio.Domain.Interfaces.IScientificUnitOfWork _unitOfWork;
    private readonly AutoMapper.IMapper _mapper;

    public CreateSpeciesCommandHandler(
        Bio.Domain.Interfaces.ISpeciesRepository repository,
        Bio.Domain.Interfaces.IScientificUnitOfWork unitOfWork,
        AutoMapper.IMapper mapper)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SpeciesResponseDTO> Handle(CreateSpeciesCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;
        var existingByScientific = await _repository.GetByScientificNameAsync(dto.ScientificName, cancellationToken);
        if (existingByScientific != null)
            throw new Bio.Domain.Exceptions.ConflictException($"Species with scientific name '{dto.ScientificName}' already exists.");
        var existingBySlug = await _repository.GetBySlugAsync(dto.Slug, cancellationToken);
        if (existingBySlug != null)
            throw new Bio.Domain.Exceptions.ConflictException($"Species with slug '{dto.Slug}' already exists.");

        var id = Guid.NewGuid();
        var species = new Bio.Domain.Entities.Species(
            id,
            dto.Slug,
            dto.ScientificName,
            dto.TaxonomyId,
            dto.ThumbnailUrl,
            dto.CommonName,
            dto.Description,
            dto.EcologicalInfo,
            dto.TraditionalUses,
            dto.EconomicPotential,
            dto.ConservationStatus,
            dto.IsSensitive);
        await _repository.AddAsync(species, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return _mapper.Map<SpeciesResponseDTO>(species);
    }
}
