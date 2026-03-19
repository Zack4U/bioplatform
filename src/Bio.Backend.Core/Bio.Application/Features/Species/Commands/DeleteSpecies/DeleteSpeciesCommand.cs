using MediatR;

namespace Bio.Application.Features.Species.Commands.DeleteSpecies;

public record DeleteSpeciesCommand(Guid Id) : IRequest<Unit>;

public class DeleteSpeciesCommandHandler : IRequestHandler<DeleteSpeciesCommand, Unit>
{
    private readonly Bio.Domain.Interfaces.ISpeciesRepository _repository;
    private readonly Bio.Domain.Interfaces.IScientificUnitOfWork _unitOfWork;

    public DeleteSpeciesCommandHandler(
        Bio.Domain.Interfaces.ISpeciesRepository repository,
        Bio.Domain.Interfaces.IScientificUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Unit> Handle(DeleteSpeciesCommand request, CancellationToken cancellationToken)
    {
        var species = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new Bio.Domain.Exceptions.NotFoundException($"Species with id {request.Id} not found.");
        await _repository.DeleteAsync(species, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
