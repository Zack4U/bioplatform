using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.UserRoles.Commands.UnassignRole;

public record UnassignRoleCommand(Guid UserId, Guid RoleId) : IRequest;

public class UnassignRoleHandler : IRequestHandler<UnassignRoleCommand>
{
    private readonly IUserRoleRepository _userRoleRepository;

    public UnassignRoleHandler(IUserRoleRepository userRoleRepository)
    {
        _userRoleRepository = userRoleRepository;
    }

    public async Task Handle(UnassignRoleCommand request, CancellationToken cancellationToken)
    {
        var userRole = await _userRoleRepository.GetByIdsAsync(request.UserId, request.RoleId);
        if (userRole == null)
        {
            throw new NotFoundException($"Assignment for User {request.UserId} and Role {request.RoleId} not found.");
        }

        await _userRoleRepository.DeleteAsync(userRole);
        await _userRoleRepository.SaveChangesAsync();
    }
}
