using MediatR;

namespace Bio.Application.Features.Taxonomy.Commands.DeleteTaxonomy;

public record DeleteTaxonomyCommand(int Id) : IRequest<Unit>;

public class DeleteTaxonomyCommandHandler : IRequestHandler<DeleteTaxonomyCommand, Unit>
{
    private readonly Bio.Domain.Interfaces.ITaxonomyRepository _repository;
    private readonly Bio.Domain.Interfaces.IScientificUnitOfWork _unitOfWork;

    public DeleteTaxonomyCommandHandler(
        Bio.Domain.Interfaces.ITaxonomyRepository repository,
        Bio.Domain.Interfaces.IScientificUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Unit> Handle(DeleteTaxonomyCommand request, CancellationToken cancellationToken)
    {
        var taxonomy = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new Bio.Domain.Exceptions.NotFoundException($"Taxonomy with id {request.Id} not found.");
        await _repository.DeleteAsync(taxonomy, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
