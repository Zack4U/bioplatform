using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Roles.Commands.DeleteRole;

public record DeleteRoleCommand(Guid Id) : IRequest;

public class DeleteRoleHandler : IRequestHandler<DeleteRoleCommand>
{
    private readonly IRoleRepository _roleRepository;

    public DeleteRoleHandler(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await _roleRepository.GetByIdAsync(request.Id);
        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID '{request.Id}' not found.");
        }

        await _roleRepository.DeleteAsync(role);
        await _roleRepository.SaveChangesAsync();
    }
}
