using Bio.Application.DTOs;
using MediatR;

namespace Bio.Application.Features.Species.Commands.UpdateSpecies;

public record UpdateSpeciesCommand(Guid Id, SpeciesUpdateDTO Dto) : IRequest<SpeciesResponseDTO>;

public class UpdateSpeciesCommandHandler : IRequestHandler<UpdateSpeciesCommand, SpeciesResponseDTO>
{
    private readonly Bio.Domain.Interfaces.ISpeciesRepository _repository;
    private readonly Bio.Domain.Interfaces.IScientificUnitOfWork _unitOfWork;
    private readonly AutoMapper.IMapper _mapper;

    public UpdateSpeciesCommandHandler(
        Bio.Domain.Interfaces.ISpeciesRepository repository,
        Bio.Domain.Interfaces.IScientificUnitOfWork unitOfWork,
        AutoMapper.IMapper mapper)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SpeciesResponseDTO> Handle(UpdateSpeciesCommand request, CancellationToken cancellationToken)
    {
        var species = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new Bio.Domain.Exceptions.NotFoundException($"Species with id {request.Id} not found.");
        var dto = request.Dto;

        if (dto.Slug != null && await _repository.ExistsBySlugExcludingIdAsync(dto.Slug, request.Id, cancellationToken))
            throw new Bio.Domain.Exceptions.ConflictException($"Slug '{dto.Slug}' is already in use by another species.");

        species.Update(
            dto.Slug,
            dto.ThumbnailUrl,
            dto.CommonName,
            dto.Description,
            dto.EcologicalInfo,
            dto.TraditionalUses,
            dto.EconomicPotential,
            dto.ConservationStatus,
            dto.IsSensitive,
            dto.TaxonomyId);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return _mapper.Map<SpeciesResponseDTO>(species);
    }
}
