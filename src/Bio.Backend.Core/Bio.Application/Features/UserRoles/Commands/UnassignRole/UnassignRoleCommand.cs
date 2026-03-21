using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.UserRoles.Commands.UnassignRole;

public record UnassignRoleCommand(Guid UserId, Guid RoleId) : IRequest;

public class UnassignRoleCommandHandler : IRequestHandler<UnassignRoleCommand>
{
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UnassignRoleCommandHandler(IUserRoleRepository userRoleRepository, IUnitOfWork unitOfWork)
    {
        _userRoleRepository = userRoleRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(UnassignRoleCommand request, CancellationToken cancellationToken)
    {
        var userRole = await _userRoleRepository.GetByIdsAsync(request.UserId, request.RoleId);
        if (userRole == null)
            throw new NotFoundException("Role assignment not found for this user.");

        await _userRoleRepository.DeleteAsync(userRole);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
