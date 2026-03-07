using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Roles.Commands.UpdateRole;

public record UpdateRoleCommand(Guid Id, RoleUpdateDTO Dto) : IRequest<RoleResponseDTO>;

public class UpdateRoleHandler : IRequestHandler<UpdateRoleCommand, RoleResponseDTO>
{
    private readonly IRoleRepository _roleRepository;

    public UpdateRoleHandler(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<RoleResponseDTO> Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await _roleRepository.GetByIdAsync(request.Id);
        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID '{request.Id}' not found.");
        }

        var normalizedName = request.Dto.Name.Trim().ToUpperInvariant();

        var existingWithSameName = await _roleRepository.GetByNameExcludingIdAsync(normalizedName, request.Id);
        if (existingWithSameName != null)
        {
            throw new InvalidOperationException($"Another role with name '{normalizedName}' already exists.");
        }

        role.Update(normalizedName, request.Dto.Description);

        await _roleRepository.SaveChangesAsync();

        return new RoleResponseDTO
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            CreatedAt = role.CreatedAt,
            UpdatedAt = role.UpdatedAt
        };
    }
}
