using Bio.Application.DTOs;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Roles.Commands.UpdateRole;

public record UpdateRoleCommand(Guid Id, RoleUpdateDTO Dto) : IRequest<RoleResponseDTO>;

public class UpdateRoleCommandHandler : IRequestHandler<UpdateRoleCommand, RoleResponseDTO>
{
    private readonly IRoleRepository _roleRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateRoleCommandHandler(IRoleRepository roleRepository, IUnitOfWork unitOfWork)
    {
        _roleRepository = roleRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<RoleResponseDTO> Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await _roleRepository.GetByIdAsync(request.Id);
        if (role == null)
        {
            throw new NotFoundException("Role", request.Id);
        }

        var normalizedName = request.Dto.Name.Trim().ToUpperInvariant();

        var existingWithSameName = await _roleRepository.GetByNameExcludingIdAsync(normalizedName, request.Id);
        if (existingWithSameName != null)
        {
            throw new Bio.Domain.Exceptions.ConflictException($"Another role with name '{normalizedName}' already exists.");
        }

        role.Update(normalizedName, request.Dto.Description);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new RoleResponseDTO(
            role.Id,
            role.Name,
            role.Description,
            role.CreatedAt,
            role.UpdatedAt
        );
    }
}
