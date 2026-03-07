using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Roles.Commands.CreateRole;

public record CreateRoleCommand(RoleCreateDTO Dto) : IRequest<RoleResponseDTO>;

public class CreateRoleHandler : IRequestHandler<CreateRoleCommand, RoleResponseDTO>
{
    private readonly IRoleRepository _roleRepository;

    public CreateRoleHandler(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<RoleResponseDTO> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;
        var normalizedName = dto.Name.Trim().ToUpperInvariant();

        var existingRole = await _roleRepository.GetByNameAsync(normalizedName);
        if (existingRole != null)
        {
            throw new InvalidOperationException($"Role with name '{normalizedName}' already exists.");
        }

        var role = new Role(Guid.NewGuid(), normalizedName, dto.Description);

        await _roleRepository.AddAsync(role);
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
